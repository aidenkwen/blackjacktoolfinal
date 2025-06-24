// src/components/pages/AddTournamentPage.jsx - Fixed version
import React, { useState } from 'react';
import { UC } from '../../utils/formatting';
import { callPowerAutomate, POWER_AUTOMATE_FLOWS, uploadToSharePoint } from '../../config/powerAutomate';

const AddTournamentPage = ({
  tournaments,
  addTournament,
  uploadPlayersFile,
  loading,
  onBack
}) => {
  const [tournamentName, setTournamentName] = useState('');
  const [entryCost, setEntryCost] = useState('500');
  const [rebuyCost, setRebuyCost] = useState('500');
  const [mulliganCost, setMulliganCost] = useState('100');
  const [importing, setImporting] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleAddTournament = async () => {
    if (!tournamentName.trim()) {
      alert('Please enter a tournament name.');
      return;
    }

    // Check if tournament already exists
const tournamentExists = tournaments && tournaments.length > 0 && tournamentName && tournamentName.trim() && 
  tournaments.some(t => t && t.name && t.name.toLowerCase() === tournamentName.trim().toLowerCase());

if (tournamentExists) {
  alert('A tournament with this name already exists.');
  return;
}

    // Validate costs
    const entry = parseInt(entryCost);
    const rebuy = parseInt(rebuyCost);
    const mulligan = parseInt(mulliganCost);

    if (isNaN(entry) || entry < 0) {
      alert('Please enter a valid entry cost.');
      return;
    }
    if (isNaN(rebuy) || rebuy < 0) {
      alert('Please enter a valid rebuy cost.');
      return;
    }
    if (isNaN(mulligan) || mulligan < 0) {
      alert('Please enter a valid mulligan cost.');
      return;
    }

    try {
      setImporting(true);
      
      // Step 1: Create tournament first via Power Automate
      const newTournament = {
        name: tournamentName.trim(),
        entryCost: entry,
        rebuyCost: rebuy,
        mulliganCost: mulligan
      };

      console.log('🏆 Creating tournament via Power Automate...');
      
      const tournamentResult = await callPowerAutomate(POWER_AUTOMATE_FLOWS.addTournament, {
        action: 'add_tournament',
        tournament: newTournament
      });

      if (!tournamentResult.success) {
        throw new Error(tournamentResult.error || 'Failed to create tournament');
      }

      console.log('✅ Tournament created successfully');
      
      // Update local state immediately
      await addTournament(newTournament);
      
      // Step 2: Upload file via Power Automate (now required)
      console.log('📁 Now uploading file to tournament...');
      
      const result = await uploadToSharePoint(selectedFile, tournamentName.trim());
      
      let message = `Tournament "${newTournament.name}" created successfully!\n\n`;
      message += `Player upload: ${result.recordsInserted} out of ${result.totalRows} records processed.`;
      
      if (result.errorCount > 0) {
        message += `\n\n${result.errorCount} rows had errors and were skipped.`;
        if (result.errors && result.errors.length > 0) {
          message += '\n\nFirst few errors:';
          result.errors.forEach(error => {
            message += `\n• ${error}`;
          });
          if (result.hasMoreErrors) {
            message += '\n• ...and more';
          }
        }
      }
      
      alert(message);
      
      // Reset form
      setTournamentName('');
      setEntryCost('500');
      setRebuyCost('500');
      setMulliganCost('100');
      setFileUploaded(false);
      setUploadedFileName('');
      setSelectedFile(null);
      
      onBack();
      
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['.csv', '.xlsx', '.xls'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!allowedTypes.includes(fileExtension)) {
        alert('Please select a valid CSV or Excel file (.csv, .xlsx, .xls).');
        return;
      }

      setSelectedFile(file);
      setUploadedFileName(file.name);
      setFileUploaded(true);
    }
  };

  // Check if form is complete (including file requirement)
  const isFormValid = tournamentName.trim() && selectedFile && !importing;

  return (
    <div className="container">
      <button
        onClick={onBack}
        className="link-back link-back-block"
      >
        {'<'} Back to Event Selection
      </button>

      <h1 className="page-title">Add Custom Tournament</h1>

      {/* Show loading indicator */}
      {loading && (
        <div className="alert alert-info" style={{ backgroundColor: '#f8f9fa', color: '#6c757d', border: '1px solid #dee2e6' }}>
          Loading tournaments data...
        </div>
      )}

      {/* Tournament Creation Form */}
      <div className="form-group">
        <label className="mb-2">Tournament Name</label>
        <input
          type="text"
          value={tournamentName}
          onChange={(e) => setTournamentName(UC(e.target.value))}
          className="input-field"
          placeholder="Enter tournament name"
          disabled={importing}
          required
        />
      </div>

      <div className="form-group">
        <label className="mb-2">Cost of Entry</label>
        <input
          type="number"
          value={entryCost}
          onChange={(e) => setEntryCost(e.target.value)}
          className="input-field"
          placeholder="500"
          disabled={importing}
          required
        />
      </div>

      <div className="form-group">
        <label className="mb-2">Cost of Rebuys</label>
        <input
          type="number"
          value={rebuyCost}
          onChange={(e) => setRebuyCost(e.target.value)}
          className="input-field"
          placeholder="500"
          disabled={importing}
          required
        />
      </div>

      <div className="form-group">
        <label className="mb-2">Cost of Mulligans</label>
        <input
          type="number"
          value={mulliganCost}
          onChange={(e) => setMulliganCost(e.target.value)}
          className="input-field"
          placeholder="100"
          disabled={importing}
          required
        />
      </div>

      {/* Import Master Data Section - Now Required */}
      <div className="form-group">
        <label className="mb-2">
          Import Master Player Data
        </label>
        <div 
          style={{ 
            border: selectedFile ? '2px solid #28a745' : '2px dashed #d32f2f', 
            borderRadius: '4px', 
            padding: '32px', 
            textAlign: 'center', 
            marginBottom: '24px',
            backgroundColor: selectedFile ? '#f8f9fa' : '#fff5f5'
          }}
        >
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={importing}
            required
          />
          
          {importing ? (
            // Show spinner while importing
            <div>
              <div 
                style={{ 
                  display: 'inline-block', 
                  width: '48px', 
                  height: '48px', 
                  border: '4px solid #CCCCCC', 
                  borderTop: '4px solid #8b0000', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite',
                  marginBottom: '16px'
                }}
              ></div>
              <p style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>
                Creating tournament and uploading players...
              </p>
              <p style={{ fontSize: '0.9rem', color: '#666666', margin: 0 }}>
                Please wait, this may take a while for large files
              </p>
            </div>
          ) : (
            // Show upload interface when not importing
            <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '3rem' }}>📁</div>
              {fileUploaded ? (
                <>
                  <p style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0, color: '#28a745' }}>
                    ✓ File selected
                  </p>
                  <p style={{ fontSize: '0.9rem', color: '#666666', margin: 0 }}>
                    {uploadedFileName}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#666666', margin: '8px 0 0 0' }}>
                    File will be uploaded when tournament is created
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0, color: '#d32f2f' }}>
                    Click to select CSV or Excel file (Required)
                  </p>
                  <p style={{ fontSize: '0.9rem', color: '#666666', margin: 0 }}>
                    Player data for this tournament
                  </p>
                </>
              )}
            </label>
          )}
        </div>
      </div>

      <button
        onClick={handleAddTournament}
        className={`btn ${isFormValid ? 'btn-success' : 'btn-secondary'}`}
        disabled={!isFormValid}
        style={{
          opacity: isFormValid ? 1 : 0.6,
          cursor: isFormValid ? 'pointer' : 'not-allowed'
        }}
      >
        {importing ? 'Creating Tournament...' : 'Create Tournament'}
      </button>
    </div>
  );
};

export default AddTournamentPage;