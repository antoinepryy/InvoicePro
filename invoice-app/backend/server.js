const express = require('express');
const cors = require('cors');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Charger la configuration du template
let templateConfig = {};
try {
  const configPath = path.join(__dirname, 'template-config.json');
  templateConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error('Erreur chargement config template:', error);
}

// Charger la liste des clients
let clientsData = {};
try {
  const clientsPath = path.join(__dirname, 'clients.json');
  clientsData = JSON.parse(fs.readFileSync(clientsPath, 'utf8'));
} catch (error) {
  console.error('Erreur chargement clients:', error);
  clientsData = { predefinedClients: [], config: {} };
}

// Charger la liste des services
let servicesData = {};
try {
  const servicesPath = path.join(__dirname, 'services.json');
  servicesData = JSON.parse(fs.readFileSync(servicesPath, 'utf8'));
} catch (error) {
  console.error('Erreur chargement services:', error);
  servicesData = { predefinedServices: [], config: {} };
}

app.post('/api/generate-invoice', async (req, res) => {
  try {
    const {
      clientName,
      clientAddress,
      invoiceNumber,
      invoiceDate,
      services,
      totalHT,
      tva,
      totalTTC
    } = req.body;

    // Charger le template PDF
    const templatePath = path.join(__dirname, 'template.pdf');
    const existingPdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    // Obtenir la première page du template
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { height } = firstPage.getSize();

    // Charger les polices - utiliser Helvetica comme équivalent moderne à Liberation Sans
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Helper pour obtenir la police
    const getFont = (fontType) => {
      return fontType === 'bold' ? boldFont : regularFont;
    };

    // Helper pour obtenir la couleur RGB
    const getColor = (colorArray) => {
      return rgb(colorArray[0], colorArray[1], colorArray[2]);
    };

    // Configuration des champs avec valeurs par défaut si config manquante
    const config = templateConfig.fields || {};

    // Remplir les champs selon la configuration
    // Note: Informations entreprise déjà présentes dans le template PDF

    // Informations client
    if (clientName && config.clientName) {
      const field = config.clientName;
      firstPage.drawText(clientName, {
        x: field.x || 350,
        y: field.y || height - 120,
        size: field.size || 10,
        font: getFont(field.font),
        color: getColor(field.color || [0, 0, 0]),
      });
    }

    if (clientAddress && config.clientAddress) {
      const field = config.clientAddress;
      const clientAddressLines = clientAddress.split('\n');
      clientAddressLines.forEach((line, index) => {
        firstPage.drawText(line, {
          x: field.x || 350,
          y: (field.y || height - 140) - (index * (field.lineHeight || 15)),
          size: field.size || 10,
          font: getFont(field.font),
          color: getColor(field.color || [0, 0, 0]),
        });
      });
    }

    // Numéro et date de facture
    if (invoiceNumber && config.invoiceNumber) {
      const field = config.invoiceNumber;
      firstPage.drawText(invoiceNumber, {
        x: field.x || 450,
        y: field.y || height - 180,
        size: field.size || 10,
        font: getFont(field.font),
        color: getColor(field.color || [0, 0, 0]),
      });
    }

    if (invoiceDate && config.invoiceDate) {
      const field = config.invoiceDate;
      firstPage.drawText(new Date(invoiceDate).toLocaleDateString('fr-FR'), {
        x: field.x || 450,
        y: field.y || height - 200,
        size: field.size || 10,
        font: getFont(field.font),
        color: getColor(field.color || [0, 0, 0]),
      });
    }

    // Services/Prestations avec rectangle optimisé
    if (services && services.length > 0 && config.services) {
      const serviceConfig = config.services;
      
      // Dimensions optimisées du tableau
      const rectTop = serviceConfig.startY || height - 300;
      const rectBottom = rectTop - (services.length * (serviceConfig.lineHeight || 20)) - 50;
      const rectLeft = 44;
      const rectRight = 550;
      
      // Dessiner le rectangle principal
      firstPage.drawRectangle({
        x: rectLeft,
        y: rectBottom,
        width: rectRight - rectLeft,
        height: rectTop - rectBottom,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1.5,
      });
      
      // Rectangle d'en-tête avec fond gris clair
      const headerHeight = 20;
      firstPage.drawRectangle({
        x: rectLeft,
        y: rectTop - headerHeight,
        width: rectRight - rectLeft,
        height: headerHeight,
        color: rgb(0.95, 0.95, 0.95),
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
      
      // En-têtes avec positions optimisées
      const headerY = rectTop - 12;
      firstPage.drawText('Description', {
        x: 50,
        y: headerY,
        size: 11,
        font: getFont('bold'),
        color: getColor([0, 0, 0]),
      });
      firstPage.drawText('Qté', {
        x: 330,
        y: headerY,
        size: 11,
        font: getFont('bold'),
        color: getColor([0, 0, 0]),
      });
      firstPage.drawText('P.U. HT', {
        x: 400,
        y: headerY,
        size: 11,
        font: getFont('bold'),
        color: getColor([0, 0, 0]),
      });
      firstPage.drawText('Total HT', {
        x: 480,
        y: headerY,
        size: 11,
        font: getFont('bold'),
        color: getColor([0, 0, 0]),
      });
      
      // Lignes verticales pour séparer les colonnes
      const colSeparators = [310, 380, 460];
      colSeparators.forEach(x => {
        firstPage.drawLine({
          start: { x, y: rectBottom },
          end: { x, y: rectTop },
          thickness: 0.5,
          color: rgb(0.7, 0.7, 0.7),
        });
      });
      
      // Services avec alignement optimisé
      services.forEach((service, index) => {
        const currentY = rectTop - headerHeight - 15 - (index * (serviceConfig.lineHeight || 20));
        
        // Ligne alternée pour la lisibilité
        if (index % 2 === 1) {
          firstPage.drawRectangle({
            x: rectLeft + 1,
            y: currentY - 8,
            width: rectRight - rectLeft - 2,
            height: serviceConfig.lineHeight || 20,
            color: rgb(0.98, 0.98, 0.98),
          });
        }
        
        // Description (alignée à gauche)
        if (service.description) {
          firstPage.drawText(service.description, {
            x: 50,
            y: currentY,
            size: 9,
            font: getFont('regular'),
            color: getColor([0, 0, 0]),
          });
        }

        // Quantité (centrée)
        if (service.quantity) {
          const qtyText = service.quantity.toString();
          firstPage.drawText(qtyText, {
            x: 340 - (qtyText.length * 2.5), // Centrage approximatif
            y: currentY,
            size: 9,
            font: getFont('regular'),
            color: getColor([0, 0, 0]),
          });
        }

        // Prix unitaire (aligné à droite)
        if (service.unitPrice) {
          const priceText = `${service.unitPrice.toFixed(2)}€`;
          firstPage.drawText(priceText, {
            x: 450 - (priceText.length * 5), // Alignement à droite
            y: currentY,
            size: 9,
            font: getFont('regular'),
            color: getColor([0, 0, 0]),
          });
        }

        // Total (aligné à droite)
        if (service.total) {
          const totalText = `${service.total.toFixed(2)}€`;
          firstPage.drawText(totalText, {
            x: 535 - (totalText.length * 5), // Alignement à droite
            y: currentY,
            size: 9,
            font: getFont('bold'),
            color: getColor([0, 0, 0]),
          });
        }
      });
    }

    // Totaux
    if (totalHT && config.totals && config.totals.totalHT) {
      const field = config.totals.totalHT;
      firstPage.drawText(`Montant HT: ${totalHT.toFixed(2)}€`, {
        x: field.x || 480,
        y: field.y || height - 450,
        size: field.size || 10,
        font: getFont(field.font),
        color: getColor(field.color || [0, 0, 0]),
      });
    }

    if (config.totals && config.totals.totalTVA) {
      const field = config.totals.totalTVA;
      const tvaAmount = (totalHT || 0) * (tva || 20) / 100;
      firstPage.drawText(`TVA (${tva || 20}%): ${tvaAmount.toFixed(2)}€`, {
        x: field.x || 480,
        y: field.y || height - 470,
        size: field.size || 10,
        font: getFont(field.font),
        color: getColor(field.color || [0, 0, 0]),
      });
    }

    if (totalTTC && config.totals && config.totals.totalTTC) {
      const field = config.totals.totalTTC;
      firstPage.drawText(`Montant TTC: ${totalTTC.toFixed(2)}€`, {
        x: field.x || 480,
        y: field.y || height - 490,
        size: field.size || 11,
        font: getFont(field.font),
        color: getColor(field.color || [0, 0, 0]),
      });
    }

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=facture.pdf');
    res.send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('Erreur génération PDF:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
  }
});

// Endpoint pour obtenir la configuration actuelle
app.get('/api/template-config', (req, res) => {
  res.json(templateConfig);
});

// Endpoint pour mettre à jour la configuration
app.post('/api/template-config', (req, res) => {
  try {
    templateConfig = req.body;
    const configPath = path.join(__dirname, 'template-config.json');
    fs.writeFileSync(configPath, JSON.stringify(templateConfig, null, 2));
    res.json({ success: true, message: 'Configuration mise à jour' });
  } catch (error) {
    console.error('Erreur sauvegarde config:', error);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
  }
});

// Endpoint pour recharger la configuration
app.post('/api/reload-config', (req, res) => {
  try {
    const configPath = path.join(__dirname, 'template-config.json');
    templateConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    res.json({ success: true, message: 'Configuration rechargée', config: templateConfig });
  } catch (error) {
    console.error('Erreur rechargement config:', error);
    res.status(500).json({ error: 'Erreur lors du rechargement' });
  }
});

// Endpoint pour obtenir la liste des clients
app.get('/api/clients', (req, res) => {
  res.json(clientsData);
});

// Endpoint pour ajouter un nouveau client
app.post('/api/clients', (req, res) => {
  try {
    const { name, address } = req.body;
    const newClient = {
      id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name,
      address,
      createdAt: new Date().toISOString().split('T')[0],
      active: true
    };
    
    clientsData.predefinedClients.push(newClient);
    
    const clientsPath = path.join(__dirname, 'clients.json');
    fs.writeFileSync(clientsPath, JSON.stringify(clientsData, null, 2));
    
    res.json({ success: true, message: 'Client ajouté', client: newClient });
  } catch (error) {
    console.error('Erreur ajout client:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du client' });
  }
});

// Endpoint pour mettre à jour un client
app.put('/api/clients/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, active } = req.body;
    
    const clientIndex = clientsData.predefinedClients.findIndex(c => c.id === id);
    if (clientIndex === -1) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    
    clientsData.predefinedClients[clientIndex] = {
      ...clientsData.predefinedClients[clientIndex],
      name,
      address,
      active: active !== undefined ? active : clientsData.predefinedClients[clientIndex].active
    };
    
    const clientsPath = path.join(__dirname, 'clients.json');
    fs.writeFileSync(clientsPath, JSON.stringify(clientsData, null, 2));
    
    res.json({ success: true, message: 'Client mis à jour', client: clientsData.predefinedClients[clientIndex] });
  } catch (error) {
    console.error('Erreur mise à jour client:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du client' });
  }
});

// Endpoints pour les services prédéfinis
app.get('/api/services', (req, res) => {
  res.json(servicesData);
});

app.post('/api/services', (req, res) => {
  try {
    const { description, defaultPrice, unit, category } = req.body;
    const newService = {
      id: description.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description,
      defaultPrice: parseFloat(defaultPrice) || 0,
      unit: unit || 'unité',
      category: category || 'Autre',
      active: true
    };
    
    servicesData.predefinedServices.push(newService);
    
    const servicesPath = path.join(__dirname, 'services.json');
    fs.writeFileSync(servicesPath, JSON.stringify(servicesData, null, 2));
    
    res.json({ success: true, message: 'Service ajouté', service: newService });
  } catch (error) {
    console.error('Erreur ajout service:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du service' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend démarré sur le port ${PORT}`);
  console.log('Configuration template chargée:', Object.keys(templateConfig).length > 0 ? '✓' : '✗');
});