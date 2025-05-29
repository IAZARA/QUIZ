import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Loader2, AlertTriangle, Table } from 'lucide-react';

interface AudienceData {
  _id: string;
  name: string;
  email: string;
  comments?: string;
  createdAt: string;
}

const AudienceDataTable: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<AudienceData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/audience-data');
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Failed to fetch audience data.');
      }
      const result: AudienceData[] = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      console.error('Error fetching audience data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const convertToCSV = (dataToConvert: AudienceData[]) => {
    const headers = ['Name', 'Email', 'Comments', 'Submission Date'];
    const rows = dataToConvert.map(item => 
      [
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.email.replace(/"/g, '""')}"`,
        `"${(item.comments || '').replace(/"/g, '""')}"`,
        `"${formatDate(item.createdAt)}"`
      ].join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  };

  const handleExportCSV = () => {
    if (data.length === 0) {
      alert(t('audienceDataTable.noDataToExport') || "No data to export.");
      return;
    }
    const csvData = convertToCSV(data);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // Feature detection
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'audience_data.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      alert(t('audienceDataTable.browserNotSupported') || "CSV export not fully supported in this browser.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-text-secondary">
        <Loader2 className="animate-spin h-8 w-8 mr-3 text-accent" />
        {t('loading') || 'Loading...'}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-md shadow-md text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">
          {t('connectionErrorTitle') || 'Error'}
        </h3>
        <p className="text-red-600 dark:text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          {t('retryButton') || 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-bg-primary shadow-lg rounded-xl border border-border-color">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-text-primary mb-4 sm:mb-0 flex items-center">
          <Table className="h-6 w-6 mr-3 text-accent" />
          {t('audienceDataTable.title') || 'Audience Submitted Data'}
        </h2>
        <button
          onClick={handleExportCSV}
          disabled={data.length === 0}
          className="px-4 py-2 bg-accent text-button-text rounded-md hover:brightness-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-5 w-5 mr-2" />
          {t('audienceDataTable.exportButton') || 'Export to CSV'}
        </button>
      </div>

      {data.length === 0 ? (
        <p className="text-text-secondary italic text-center py-8">
          {t('audienceDataTable.noData') || 'No audience data submitted yet.'}
        </p>
      ) : (
        <div className="overflow-x-auto shadow-md rounded-lg border border-border-color">
          <table className="min-w-full divide-y divide-border-color bg-bg-secondary">
            <thead className="bg-bg-primary">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {t('audienceDataTable.nameHeader') || 'Name'}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {t('audienceDataTable.emailHeader') || 'Email'}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {t('audienceDataTable.commentsHeader') || 'Comments'}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {t('audienceDataTable.dateHeader') || 'Submission Date'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {data.map((item) => (
                <tr key={item._id} className="hover:bg-accent/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{item.email}</td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-text-secondary break-words max-w-xs">
                    {item.comments || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{formatDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AudienceDataTable;
