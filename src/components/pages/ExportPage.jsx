// src/components/pages/ExportPage.jsx
import React, { useState } from 'react';
import Papa from 'papaparse';

const ExportPage = ({ selectedEvent, employee, masterData, registrations, setCurrentPage }) => {
  const [exportType, setExportType] = useState('registrations');
  const [selectedExportRound, setSelectedExportRound] = useState('');

  const rounds = [
    { key: 'round1', name: 'Round 1' },
    { key: 'rebuy1', name: 'Rebuy 1' },
    { key: 'rebuy2', name: 'Rebuy 2' },
    { key: 'round2', name: 'Round 2' },
    { key: 'superrebuy', name: 'Super Rebuy' },
    { key: 'quarterfinals', name: 'Quarterfinals' },
    { key: 'semifinals', name: 'Semifinals' }
  ];

  const exportData = () => {
    if (!selectedExportRound) {
      alert('Please select a round to export.');
      return;
    }

    const roundKey = selectedExportRound;
    let dataToExport = [];
    let filename = '';

    if (exportType === 'registrations') {
      dataToExport = registrations
        .filter((r) => r.round === roundKey)
        .map((r) => ({
          PlayerAccountNumber: r.playerAccountNumber,
          FirstName: r.firstName,
          LastName: r.lastName,
          EventName: r.eventName,
          EventType: r.eventType,
          PaymentType: r.paymentType,
          PaymentAmount: r.paymentAmount,
          PaymentType2: r.paymentType2,
          PaymentAmount2: r.paymentAmount2,
          RegistrationDate: r.registrationDate,
          Host: r.host,
          Comment: r.comment,
          Employee: r.employee
        }));

      filename = `${selectedEvent}_${roundKey}_Registrations_${new Date()
        .toISOString()
        .split('T')[0]}.csv`;
    } else {
      const roundRegistrations = registrations.filter((r) => r.round === roundKey);
      const combinedData = [];
      
      if (roundKey === 'round1') {
        combinedData.push(...masterData.map((player) => ({
          PlayerAccountNumber: player.PlayerAccountNumber,
          FirstName: player.FirstName,
          LastName: player.LastName,
          EventName: selectedEvent,
          EventType: player.EntryType,
          PaymentType: player.EntryType === 'COMP' ? 'Comp' : 'Cash',
          PaymentAmount: player.EntryType === 'COMP' ? 0 : 500,
          UploadedDate: new Date().toISOString(),
          Host: player.host || '',
          Employee: employee
        })));
      }

      combinedData.push(...roundRegistrations.map((reg) => ({
        PlayerAccountNumber: reg.playerAccountNumber,
        FirstName: reg.firstName,
        LastName: reg.lastName,
        EventName: reg.eventName,
        EventType: reg.eventType,
        PaymentType: reg.paymentType,
        PaymentAmount: reg.paymentAmount,
        PaymentType2: reg.paymentType2,
        PaymentAmount2: reg.paymentAmount2,
        RegistrationDate: reg.registrationDate,
        Host: reg.host,
        Comment: reg.comment,
        Employee: reg.employee
      })));

      dataToExport = combinedData;
      filename = `${selectedEvent}_${roundKey}_Complete_${new Date()
        .toISOString()
        .split('T')[0]}.csv`;
    }

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);

    alert(`Exported ${dataToExport.length} records`);
  };

  return (
    <div className="container">
      <button
  onClick={() => setCurrentPage(1)}
  className="link-back link-back-block"
>
  {'<'} Back to Registration
</button>

<h1 className="page-title">Export Data</h1>

      <div className="form-group">
        <label className="mb-2">Export Type</label>
        <select
          value={exportType}
          onChange={(e) => setExportType(e.target.value)}
          className="select-field"
        >
          <option value="registrations">New Registrations Only</option>
          <option value="combined">Master Data + New Registrations</option>
        </select>
      </div>

      <div className="form-group">
        <label className="mb-2">Select Round</label>
        <select
          value={selectedExportRound}
          onChange={(e) => setSelectedExportRound(e.target.value)}
          className="select-field"
        >
          <option value="">-- Select Round --</option>
          {rounds.map((round) => (
            <option key={round.key} value={round.key}>
              {round.name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={exportData}
        disabled={registrations.length === 0}
        className={`btn btn-success ${
          registrations.length === 0 ? 'btn-disabled' : ''
        }`}
      >
        Export Data
      </button>
    </div>
  );
};

export default ExportPage;