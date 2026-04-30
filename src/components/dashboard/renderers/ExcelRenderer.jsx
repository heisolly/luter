import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'

export default function ExcelRenderer({ fileUrl }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadExcel = async () => {
      try {
        const res = await fetch(fileUrl)
        const ab = await res.arrayBuffer()
        const wb = XLSX.read(ab, { type: 'array' })
        const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 })
        setData(json)
      } catch (err) {
        console.error('Excel loading error:', err)
      } finally {
        setLoading(false)
      }
    }
    loadExcel()
  }, [fileUrl])

  return (
    <div className="bg-gray-100 min-h-full py-10" style={{ background: '#F8FAFC' }}>
      <div className="max-w-6xl mx-auto" style={{ background: 'white', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', border: '1.5px solid #F1F5F9', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>Loading Spreadsheet...</div>
        ) : (
          <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #E2E8F0' }}>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: 12, fontSize: 13, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? '#1A102D' : '#475569', borderRight: '1px solid #F1F5F9' }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
