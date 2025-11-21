const axios = require('axios');
const fs = require('fs');

const baseURL = 'http://localhost:3001';

// Données des factures à générer
const invoices = [
  {
    date: '2025-07-08',
    formNumber: 945,
    description: 'Maintenance Site Internet',
    amount: 108.00
  },
  {
    date: '2025-08-08', 
    formNumber: 955,
    description: 'Maintenance Site Internet',
    amount: 108.00
  },
  {
    date: '2025-09-08',
    formNumber: 965, 
    description: 'Maintenance Site Internet',
    amount: 108.00
  },
  {
    date: '2025-10-08',
    formNumber: 975,
    description: 'Maintenance Site Internet', 
    amount: 108.00
  },
  {
    date: '2025-11-08',
    formNumber: 985,
    description: 'Maintenance Site Internet',
    amount: 108.00
  }
];

async function generateInvoices() {
  for (const invoice of invoices) {
    console.log(`Génération facture ${invoice.formNumber} pour ${invoice.date}...`);
    
    // Calculer le numéro de facture au format DDMMYYYY-N
    const [year, month, day] = invoice.date.split('-');
    const invoiceNumber = `${day}${month}${year}-${invoice.formNumber}`;
    
    // 108€ TTC = 90€ HT (108 / 1.20 = 90)
    const htAmount = invoice.amount / 1.20;
    
    const invoiceData = {
      clientName: 'S.G.S',
      clientAddress: '5 rue de la forêt\n57220 Gomelange\nFrance',
      invoiceNumber: invoiceNumber,
      invoiceDate: invoice.date,
      services: [{
        description: invoice.description,
        quantity: 1,
        unitPrice: htAmount, // Prix unitaire HT pour affichage dans tableau
        total: htAmount // Total HT
      }],
      totalHT: htAmount,
      tva: 20,
      totalTTC: invoice.amount,
      inputMode: 'HT' // Changer en HT car on envoie les prix HT
    };

    try {
      const response = await axios.post(`${baseURL}/api/generate-invoice`, invoiceData, {
        responseType: 'arraybuffer'
      });

      const filename = `facture-sgs-${invoiceNumber}.pdf`;
      fs.writeFileSync(filename, response.data);
      console.log(`✅ Facture générée: ${filename}`);
      
    } catch (error) {
      console.error(`❌ Erreur génération facture ${invoice.formNumber}:`, error.message);
    }

    // Pause entre les générations
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Toutes les factures ont été générées!');
}

generateInvoices().catch(console.error);