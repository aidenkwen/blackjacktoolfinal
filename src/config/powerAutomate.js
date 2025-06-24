// src/config/powerAutomate.js

// Power Automate Flow URLs - Replace these with your actual webhook URLs
export const POWER_AUTOMATE_FLOWS = {
  // Tournament management flows
  getTournaments: "https://prod-13.westus.logic.azure.com:443/workflows/230b2ca83df6473589b9404b76dc658a/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=IdVbe06qp8pdcOGXMMpuiXpfusQK3NJFQdgWS47CcG0",
  addTournament: "https://prod-135.westus.logic.azure.com:443/workflows/d21c52ebbde241c0aea7341a93167efd/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=wW7Qv2bCYE4sul_lVETiUg4QZgsr0lXITRmpjUEl8mw",
  deleteTournament: "https://prod-109.westus.logic.azure.com:443/workflows/f0b1570b27664a47aec482fd0bb13cfb/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=QoNDdOGfHPTDeRkrUJRQx1TbARG7P7GriqTZ_Vbo0F0",
  
  // Player management flows
  getPlayers: "https://prod-170.westus.logic.azure.com:443/workflows/39950e2704d24ad88520f25e5bf30377/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=wwILD7pjwS89DFrdibbqGFIBzWsD48U5mP39EOepiPI",
  uploadPlayers: "https://prod-42.westus.logic.azure.com:443/workflows/76efd06edb5f4f04b49436c3d49172fe/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=41WiIwvFWTrPTQr7Mjc39TgnJB8ckxqFotVxmekXSzA",
  
  // Registration management flows
  getRegistrations: "https://prod-63.westus.logic.azure.com:443/workflows/77e88cff785f41418e88c80638af370c/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=kcEvzLoYmT0esbAHO2UWrjQgVhvaPEFebfnsyXgO-3s",
  addRegistration: "https://prod-09.westus.logic.azure.com:443/workflows/9e6ebd0e3e154aaea717d493bbd11fa3/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=HT87bhPV7UCkU1S6CXpYhjGjG0yDkef20LpQyB7XB-k"
};

// Helper function to make Power Automate requests
export const callPowerAutomate = async (flowUrl, data = {}, method = 'POST') => {
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (method !== 'GET' && data) {
    options.body = JSON.stringify({
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  const response = await fetch(flowUrl, options);
  
  if (!response.ok) {
    throw new Error(`Power Automate flow failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// Enhanced helper for CSV uploads
export const uploadToSharePoint = async (file, eventName) => {
  // Parse CSV client-side using Papa Parse
  const csvText = await file.text();
  const Papa = await import('papaparse');
  
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: header => header.trim(),
    dynamicTyping: false
  });

  console.log(`📊 Parsed ${parsed.data.length} rows from CSV`);

  // Process in batches for Power Automate (max 100 items per batch)
  const batchSize = 50; // Conservative batch size for Power Automate
  const batches = [];
  
  for (let i = 0; i < parsed.data.length; i += batchSize) {
    batches.push(parsed.data.slice(i, i + batchSize));
  }

  console.log(`📦 Split into ${batches.length} batches`);

  const results = [];
  let totalInserted = 0; // Initialize as number, not string
  const errors = [];

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    
    try {
      console.log(`⏳ Processing batch ${batchIndex + 1}/${batches.length}`);
      
      const result = await callPowerAutomate(POWER_AUTOMATE_FLOWS.uploadPlayers, {
        action: 'upload_players_batch',
        eventName: eventName,
        batchIndex: batchIndex,
        totalBatches: batches.length,
        isFirstBatch: batchIndex === 0, // Flag to clear existing data
        players: batch.map((row, index) => {
          // Process each player row
          const accountNumber = row.PlayerAccountNumber || 
                               row['Player Account Number'] || 
                               row.accountNumber ||
                               row.AccountNumber;
          
          const firstName = row.FirstName || 
                           row['First Name'] || 
                           row.firstName ||
                           row.first_name;
          
          const lastName = row.LastName || 
                          row['Last Name'] || 
                          row.lastName ||
                          row.last_name;
          
          const rawEntryType = (row.EntryType || 
                               row['Entry Type'] || 
                               row.entryType ||
                               row.Type ||
                               'PAY').toString().toUpperCase();
          
          const cleanEntryType = rawEntryType.includes('PAY') ? 'PAY' : 
                                rawEntryType.includes('COMP') ? 'COMP' : 
                                rawEntryType;
          
          const host = row.Host || 
                      row.host || 
                      row.HOST ||
                      '';

          return {
            PlayerAccountNumber: accountNumber?.toString().trim(),
            FirstName: firstName?.toString().trim().toUpperCase(),
            LastName: lastName?.toString().trim().toUpperCase(),
            EntryType: cleanEntryType,
            Host: host?.toString().trim(),
            EventName: eventName,
            RowNumber: (batchIndex * batchSize) + index + 2 // For error reporting
          };
        })
      });

      if (result.success) {
        // FIX: Convert to number before adding to prevent string concatenation
        const recordsInserted = parseInt(result.recordsInserted) || batch.length;
        totalInserted += recordsInserted;
        
        // Debug logging to see what we're getting back
        console.log(`Batch ${batchIndex + 1} result:`, {
          recordsInserted: result.recordsInserted,
          recordsInsertedParsed: recordsInserted,
          totalInserted: totalInserted
        });
        
        results.push(result);
      } else {
        errors.push(`Batch ${batchIndex + 1}: ${result.error || 'Unknown error'}`);
      }

      // Add delay between batches to avoid throttling
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`Error processing batch ${batchIndex + 1}:`, error);
      errors.push(`Batch ${batchIndex + 1}: ${error.message}`);
    }
  }

  console.log(`Final totals - Inserted: ${totalInserted}, Total Rows: ${parsed.data.length}`);

  return {
    recordsInserted: totalInserted,
    totalRows: parsed.data.length,
    errorCount: errors.length,
    errors: errors.slice(0, 10),
    hasMoreErrors: errors.length > 10,
    batchResults: results
  };
};