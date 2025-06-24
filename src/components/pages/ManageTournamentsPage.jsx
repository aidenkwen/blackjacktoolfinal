// src/components/pages/ManageTournamentsPage.jsx
import React from 'react';

const ManageTournamentsPage = ({
  tournaments,
  deleteTournament,
  selectedEvent,
  onBack
}) => {
  const handleDeleteTournament = async (tournamentToDelete) => {
    // Show confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${tournamentToDelete.name}"?\n\nThis will also delete all players and registrations for this tournament.\n\nThis action cannot be undone.`
    );

    if (confirmDelete) {
      try {
        // Debug: Log the tournament object to see what ID field is available
        console.log('Tournament to delete:', tournamentToDelete);
        
        // Try different possible ID field names that SharePoint might use
        const tournamentId = tournamentToDelete.id || 
                            tournamentToDelete.ID || 
                            tournamentToDelete.Id ||
                            tournamentToDelete.name; // Fallback to name if no ID
        
        if (!tournamentId) {
          throw new Error('No valid tournament identifier found');
        }
        
        console.log('Using tournament ID:', tournamentId);
        
        await deleteTournament(tournamentId);
        alert(`Tournament "${tournamentToDelete.name}" deleted successfully.`);
      } catch (error) {
        console.error('Delete tournament error:', error);
        alert(`Error deleting tournament: ${error.message}`);
      }
    }
  };

  return (
    <div className="container">
      <button onClick={onBack} className="link-back link-back-block">
        {'<'} Back to Event Selection
      </button>

      <h1 className="page-title">Manage Tournaments</h1>

      {tournaments.length === 0 ? (
        <p className="subheading">
          No custom tournaments yet.
        </p>
      ) : (
        <div>
          <p className="subheading">
            {tournaments.length} custom tournament{tournaments.length !== 1 ? 's' : ''}
          </p>

          {tournaments.map((tournament) => (
            <div
              key={tournament.id || tournament.ID || tournament.name}
              className="card"
              style={{
                marginBottom: '12px',
                backgroundColor: selectedEvent === tournament.name ? '#e8f5e8' : '#f2f2f2',
                borderColor: selectedEvent === tournament.name ? '#28a745' : '#d9d9d9',
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {tournament.name}
                  </p>
                  <p style={{ margin: '4px 0 0 0', color: '#666666', fontSize: '0.9rem' }}>
                    Entry: ${tournament.entryCost} • Rebuy: ${tournament.rebuyCost} • Mulligan: ${tournament.mulliganCost}
                  </p>
                  {tournament.createdDate && (
                    <p style={{ margin: '4px 0 0 0', color: '#999999', fontSize: '0.8rem' }}>
                      Created: {new Date(tournament.createdDate).toLocaleDateString()}
                    </p>
                  )}
                  {selectedEvent === tournament.name && (
                    <p style={{ margin: '4px 0 0 0', color: '#28a745', fontSize: '0.85rem', fontWeight: '600' }}>
                      ✓ Currently Active
                    </p>
                  )}
                  
                  {/* Debug info - remove this after fixing */}
                  {process.env.NODE_ENV === 'development' && (
                    <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                      Debug ID: {tournament.id || tournament.ID || 'No ID found'}
                    </p>
                  )}
                </div>

                {selectedEvent !== tournament.name && (
                  <button
                    onClick={() => handleDeleteTournament(tournament)}
                    className="btn btn-danger"
                    style={{ fontSize: '0.9rem' }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageTournamentsPage;