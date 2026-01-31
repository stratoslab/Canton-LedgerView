import { useState } from 'react'
import './App.css'

function App() {
  const [walletAddress, setWalletAddress] = useState('')
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchTransactions = async () => {
    if (!walletAddress.trim()) {
      setError('Please enter a wallet address')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      // Mock Canton network transactions for demo
      const mockTxs = Array.from({ length: 10 }, (_, i) => ({
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        from: `0x${Math.random().toString(16).substr(2, 40)}`,
        to: walletAddress,
        value: (Math.random() * 10).toFixed(6),
        timestamp: Date.now() - (i * 86400000),
        gasUsed: Math.floor(Math.random() * 50000) + 21000,
        status: Math.random() > 0.1 ? 'Success' : 'Failed',
        blockNumber: 1000000 - i
      }))
      
      setTransactions(mockTxs)
    } catch (err) {
      setError('Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = () => {
    const csvHeader = [
      '# Canton LedgerView CSV Export',
      '# Date,Transaction Hash,From Address,To Address,Value (ETH),Gas Used,Status,Block Number',
      ''
    ].join('\n')

    const csvData = transactions.map(tx => [
      new Date(tx.timestamp).toISOString().split('T')[0],
      tx.hash,
      tx.from,
      tx.to,
      tx.value,
      tx.gasUsed,
      tx.status,
      tx.blockNumber
    ].join(',')).join('\n')

    const blob = new Blob([csvHeader + csvData], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `canton_ledgerview_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <img 
            src="https://www.canton.network/hubfs/canton-logo-black.svg" 
            alt="Canton Network" 
            className="canton-logo"
          />
          <h1>LedgerView</h1>
        </div>
        
        <div className="input-section">
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Enter Canton wallet address..."
            className="wallet-input"
          />
          <button onClick={fetchTransactions} disabled={loading} className="fetch-btn">
            {loading ? 'Loading...' : 'Get Transactions'}
          </button>
          {transactions.length > 0 && (
            <button onClick={downloadCSV} className="download-btn">
              Download CSV
            </button>
          )}
        </div>

        {error && <div className="error">{error}</div>}

        {transactions.length > 0 && (
          <div className="table-container">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Hash</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Value (ETH)</th>
                  <th>Gas Used</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr key={i}>
                    <td>{new Date(tx.timestamp).toLocaleDateString()}</td>
                    <td className="hash">{tx.hash.substring(0, 10)}...</td>
                    <td className="hash">{tx.from.substring(0, 10)}...</td>
                    <td className="hash">{tx.to.substring(0, 10)}...</td>
                    <td>{tx.value}</td>
                    <td>{tx.gasUsed.toLocaleString()}</td>
                    <td className={`status ${tx.status.toLowerCase()}`}>{tx.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
