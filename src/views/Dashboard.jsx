import React, { useState, useEffect, useRef } from 'react';
import { Download, CalendarIcon, DollarSign, Wallet, Scale, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../lib/api';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import './Dashboard.css';

const monthLabels = ['JAN', 'FEB', 'MAR', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export const Dashboard = () => {
  const containerRef = useRef(null);
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    cards: {
      todayRecovery: 0,
      weeklyRecovery: 0,
      monthlyRecovery: 0,
      totalAmountSale: 0,
      totalBalanceSale: 0,
      totalBalanceCost: 0,
      totalProfitLoss: 0,
      lastMonthRecovery: 0,
    },
    windows: {
      weekly: { since: '', reset: '' },
      monthly: { since: '', reset: '' },
      lastMonth: { since: '', reset: '' },
    },
    todayRecoveryByMan: [],
    monthWeeks: [],
    cycleStartDate: '',
  });
  const [cycleInput, setCycleInput] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      setData(res || data);
      setCycleInput(res?.cycleStartDate || '');
    } catch {
      addToast('Failed to load dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleApplyCycle = async () => {
    if (!cycleInput) {
      addToast('Please select a cycle start date', 'info');
      return;
    }

    try {
      await api.put('/dashboard/cycle', { cycleStartDate: cycleInput });
      addToast('Cycle start date updated successfully', 'success');
      await fetchDashboard();
    } catch (error) {
      addToast(error.message || 'Failed to update cycle', 'error');
    }
  };

  const handleDownloadPDF = async () => {
    if (!containerRef.current) return;

    try {
      addToast('Preparing your PDF...', 'info');
      const canvas = await html2canvas(containerRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#050505' : '#f8fafc',
        ignoreElements: (element) => element.classList?.contains('no-print'),
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Shah-Ledger-Dashboard-${new Date().toISOString().split('T')[0]}.pdf`);
      addToast('Dashboard downloaded successfully', 'success');
    } catch (error) {
      addToast(error.message || 'Failed to generate PDF', 'error');
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount || 0);

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '-';
    const raw = String(dateStr).includes('T') ? String(dateStr).split('T')[0] : String(dateStr);
    const [year, month, day] = raw.split('-');
    const monthIndex = Number(month) - 1;
    if (!year || Number.isNaN(monthIndex) || !day || !monthLabels[monthIndex]) return raw;
    return `${year}-${monthLabels[monthIndex]}-${day}`;
  };

  useGSAP(() => {
    if (!loading && containerRef.current) {
      gsap.fromTo('.stat-card', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power2.out' });
      gsap.fromTo('.dashboard-sections .card, .cycle-setup-panel, .download-btn-container', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, stagger: 0.08, ease: 'power2.out' });
    }
  }, [loading, data]);

  if (loading) {
    return <div className="p-4 text-center text-muted">Loading dashboard...</div>;
  }

  const profitLossPositive = Number(data.cards?.totalProfitLoss || 0) >= 0;

  return (
    <div className="dashboard-container print-area" ref={containerRef}>
      <div className="download-btn-container no-print">
        <button className="btn btn-secondary" onClick={handleDownloadPDF}>
          <Download size={18} />
          Download Dashboard PDF
        </button>
      </div>

      <div className="cycle-setup-panel no-print">
        <div className="input-group">
          <label className="form-label">Recovery Cycle Start Date</label>
          <div className="cycle-input-row">
            <input type="date" className="input-field" value={cycleInput} onChange={(e) => setCycleInput(e.target.value)} />
            <button className="btn btn-primary" onClick={handleApplyCycle}>Apply</button>
          </div>
        </div>
        <div className="cycle-info">
          <span>Current Start Date</span>
          <strong>{data.cycleStartDate ? formatDateLabel(data.cycleStartDate) : 'Not Set'}</strong>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <span className="stat-title">Today's Recovery</span>
          <span className="stat-value">{formatCurrency(data.cards?.todayRecovery)}</span>
          <small className="stat-meta"><span>Current day total</span></small>
          <DollarSign size={44} className="stat-icon" />
        </div>
        <div className="stat-card">
          <span className="stat-title">Weekly Recovery</span>
          <span className="stat-value">{formatCurrency(data.cards?.weeklyRecovery)}</span>
          <small className="stat-meta">
            <span>Since: {formatDateLabel(data.windows?.weekly?.since)}</span>
            <span>End: {formatDateLabel(data.windows?.weekly?.reset)}</span>
          </small>
          <CalendarIcon size={44} className="stat-icon" />
        </div>
        <div className="stat-card">
          <span className="stat-title">Monthly Recovery</span>
          <span className="stat-value">{formatCurrency(data.cards?.monthlyRecovery)}</span>
          <small className="stat-meta">
            <span>Since: {formatDateLabel(data.windows?.monthly?.since)}</span>
            <span>End: {formatDateLabel(data.windows?.monthly?.reset)}</span>
          </small>
          <CalendarIcon size={44} className="stat-icon" />
        </div>
        <div className="stat-card">
          <span className="stat-title">Last Month Recovery</span>
          <span className="stat-value">{formatCurrency(data.cards?.lastMonthRecovery)}</span>
          <small className="stat-meta">
            <span>Since: {formatDateLabel(data.windows?.lastMonth?.since)}</span>
            <span>End: {formatDateLabel(data.windows?.lastMonth?.reset)}</span>
          </small>
          <CalendarIcon size={44} className="stat-icon" />
        </div>
        <div className="stat-card">
          <span className="stat-title">Total Amount Sale</span>
          <span className="stat-value">{formatCurrency(data.cards?.totalAmountSale)}</span>
          <small className="stat-meta"><span>Ledger principal</span></small>
          <Wallet size={44} className="stat-icon" />
        </div>
        <div className="stat-card">
          <span className="stat-title">Total Balance Sale</span>
          <span className="stat-value">{formatCurrency(data.cards?.totalBalanceSale)}</span>
          <small className="stat-meta"><span>Outstanding sale amount</span></small>
          <Wallet size={44} className="stat-icon" />
        </div>
        <div className="stat-card">
          <span className="stat-title">Total Balance Cost</span>
          <span className="stat-value">{formatCurrency(data.cards?.totalBalanceCost)}</span>
          <small className="stat-meta"><span>Outstanding cost basis</span></small>
          <Scale size={44} className="stat-icon" />
        </div>
        <div className="stat-card">
          <span className="stat-title">Total Profit/Loss</span>
          <span className={`stat-value ${profitLossPositive ? 'profit-positive' : 'profit-negative'}`}>{formatCurrency(data.cards?.totalProfitLoss)}</span>
          <small className="stat-meta"><span>Sale value minus cost value</span></small>
          {profitLossPositive ? <TrendingUp size={44} className="stat-icon" /> : <TrendingDown size={44} className="stat-icon" />}
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="card">
          <div className="card-header">
            <h3>Today's Recovery by Staff</h3>
          </div>
          <div className="card-body p-0">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Recovery Man</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.todayRecoveryByMan?.length > 0 ? data.todayRecoveryByMan.map((row) => (
                    <tr key={row.recoveryManName}>
                      <td>{row.recoveryManName}</td>
                      <td className="font-semibold">{formatCurrency(row.amount)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="2" className="text-center">No recovery today</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Weekly Breakdown</h3>
          </div>
          <div className="card-body p-0 compact-weekly-card">
            <div className="table-wrapper weekly-table-wrap">
              <table className="data-table weekly-table">
                <thead>
                  <tr>
                    <th className="week-col">Week</th>
                    <th className="date-col">Since</th>
                    <th className="date-col">End</th>
                    <th className="amount-col">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.monthWeeks?.length > 0 ? data.monthWeeks.map((week) => (
                    <tr key={week.weekNumber}>
                      <td className="week-cell">Week {week.weekNumber}</td>
                      <td className="muted-date">{formatDateLabel(week.since)}</td>
                      <td className="muted-date">{formatDateLabel(week.reset)}</td>
                      <td className="amount-cell font-semibold text-primary">{formatCurrency(week.amount)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="text-center">No weekly data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
