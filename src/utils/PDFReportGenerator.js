import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export class PDFReportGenerator {
  constructor(cache, user) {
    this.cache = cache;
    this.user = user;
    this.doc = new jsPDF();
    this.currentY = 20;
    this.pageHeight = this.doc.internal.pageSize.height;
    this.margin = 20;
  }

  // Check if we need a new page
  checkPageBreak(neededHeight = 30) {
    if (this.currentY + neededHeight > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = 20;
      return true;
    }
    return false;
  }

  // Add header to each page
  addHeader() {
    this.doc.setFontSize(16);
    this.doc.setFont(undefined, 'bold');
    this.doc.text('Analytics Dashboard Report', this.margin, this.currentY);
    this.currentY += 10;
    
    this.doc.setFontSize(10);
    this.doc.setFont(undefined, 'normal');
    this.doc.text(`Generated for: ${this.user?.name || 'User'}`, this.margin, this.currentY);
    this.currentY += 5;
    this.doc.text(`Generated on: ${new Date().toLocaleString()}`, this.margin, this.currentY);
    this.currentY += 15;
  }

  // Process Google Ads data to table format
  processGoogleAdsData(data, customerId, period, endpoint) {
    const tables = [];
    
    try {
      console.log(`Processing Google Ads data for endpoint: ${endpoint}`, data);
      
      if (endpoint.includes('key-stats')) {
        if (data && typeof data === 'object') {
          const tableData = Object.entries(data).map(([key, value]) => [
            this.formatKey(key),
            this.formatValue(value)
          ]);

          tables.push({
            title: `Google Ads Key Stats (Customer: ${customerId}, Period: ${period})`,
            headers: ['Metric', 'Value'],
            data: tableData
          });
        }
      } else if (endpoint.includes('campaigns') || endpoint.includes('campaign-details')) {
        if (Array.isArray(data)) {
          const tableData = data.map((item, index) => [
            item.name || item.campaignName || `Campaign ${index + 1}`,
            item.status || 'N/A',
            item.impressions?.toString() || '0',
            item.clicks?.toString() || '0',
            item.cost ? `${(item.cost / 1000000).toFixed(2)}` : '$0.00',
            item.ctr ? `${(item.ctr * 100).toFixed(2)}%` : '0%'
          ]);

          tables.push({
            title: `Google Ads Campaigns (Customer: ${customerId}, Period: ${period})`,
            headers: ['Campaign Name', 'Status', 'Impressions', 'Clicks', 'Cost', 'CTR'],
            data: tableData
          });
        }
      } else if (endpoint.includes('keywords')) {
        if (Array.isArray(data)) {
          const tableData = data.map((item, index) => [
            item.keyword || item.text || `Keyword ${index + 1}`,
            item.matchType || 'N/A',
            item.impressions?.toString() || '0',
            item.clicks?.toString() || '0',
            item.cost ? `${(item.cost / 1000000).toFixed(2)}` : '$0.00',
            item.cpc ? `${(item.cpc / 1000000).toFixed(2)}` : '$0.00'
          ]);

          tables.push({
            title: `Google Ads Keywords (Customer: ${customerId}, Period: ${period})`,
            headers: ['Keyword', 'Match Type', 'Impressions', 'Clicks', 'Cost', 'CPC'],
            data: tableData
          });
        }
      } else if (endpoint.includes('device-performance')) {
        if (Array.isArray(data)) {
          const tableData = data.map(item => [
            item.device || 'Unknown',
            item.impressions?.toString() || '0',
            item.clicks?.toString() || '0',
            item.cost ? `${(item.cost / 1000000).toFixed(2)}` : '$0.00',
            item.ctr ? `${(item.ctr * 100).toFixed(2)}%` : '0%'
          ]);

          tables.push({
            title: `Google Ads Device Performance (Customer: ${customerId}, Period: ${period})`,
            headers: ['Device', 'Impressions', 'Clicks', 'Cost', 'CTR'],
            data: tableData
          });
        }
      } else if (endpoint.includes('time-performance')) {
        if (Array.isArray(data)) {
          const tableData = data.map(item => [
            item.date || item.time || 'Unknown',
            item.impressions?.toString() || '0',
            item.clicks?.toString() || '0',
            item.cost ? `${(item.cost / 1000000).toFixed(2)}` : '$0.00'
          ]);

          tables.push({
            title: `Google Ads Time Performance (Customer: ${customerId}, Period: ${period})`,
            headers: ['Date/Time', 'Impressions', 'Clicks', 'Cost'],
            data: tableData
          });
        }
      } else {
        // Generic fallback for any other data
        if (data && typeof data === 'object') {
          if (Array.isArray(data)) {
            const tableData = data.map((item, index) => [
              index + 1,
              JSON.stringify(item).substring(0, 100) + '...'
            ]);
            
            tables.push({
              title: `Google Ads ${endpoint} (Customer: ${customerId}, Period: ${period})`,
              headers: ['Index', 'Data'],
              data: tableData
            });
          } else {
            const tableData = Object.entries(data).map(([key, value]) => [
              this.formatKey(key),
              this.formatValue(value)
            ]);

            tables.push({
              title: `Google Ads ${endpoint} (Customer: ${customerId}, Period: ${period})`,
              headers: ['Metric', 'Value'],
              data: tableData
            });
          }
        }
      }
    } catch (error) {
      console.error('Error processing Google Ads data:', error);
    }

    return tables;
  }

  // Convert Google Analytics data to table format
  processGoogleAnalyticsData(data, propertyId, period, endpoint) {
    const tables = [];
    
    try {
      if (endpoint === 'overview') {
        if (data && typeof data === 'object') {
          const tableData = Object.entries(data).map(([key, value]) => [
            this.formatKey(key),
            this.formatValue(value)
          ]);

          tables.push({
            title: `Google Analytics Overview (Property: ${propertyId}, Period: ${period})`,
            headers: ['Metric', 'Value'],
            data: tableData
          });
        }
      } else if (endpoint === 'traffic') {
        if (Array.isArray(data)) {
          const tableData = data.map(item => [
            item.date || 'N/A',
            item.sessions?.toString() || '0',
            item.users?.toString() || '0',
            item.pageviews?.toString() || '0',
            item.bounceRate ? `${(item.bounceRate * 100).toFixed(2)}%` : '0%'
          ]);

          tables.push({
            title: `Google Analytics Traffic (Property: ${propertyId}, Period: ${period})`,
            headers: ['Date', 'Sessions', 'Users', 'Pageviews', 'Bounce Rate'],
            data: tableData
          });
        }
      } else if (endpoint === 'demographics') {
        if (data && data.ageGroups && Array.isArray(data.ageGroups)) {
          const ageTableData = data.ageGroups.map(item => [
            item.ageGroup || 'N/A',
            item.sessions?.toString() || '0',
            item.percentage ? `${item.percentage.toFixed(2)}%` : '0%'
          ]);

          tables.push({
            title: `Analytics Demographics - Age Groups (Property: ${propertyId}, Period: ${period})`,
            headers: ['Age Group', 'Sessions', 'Percentage'],
            data: ageTableData
          });
        }

        if (data && data.genders && Array.isArray(data.genders)) {
          const genderTableData = data.genders.map(item => [
            item.gender || 'N/A',
            item.sessions?.toString() || '0',
            item.percentage ? `${item.percentage.toFixed(2)}%` : '0%'
          ]);

          tables.push({
            title: `Analytics Demographics - Gender (Property: ${propertyId}, Period: ${period})`,
            headers: ['Gender', 'Sessions', 'Percentage'],
            data: genderTableData
          });
        }
      }
    } catch (error) {
      console.error('Error processing Google Analytics data:', error);
    }

    return tables;
  }

  // Format keys for better readability
  formatKey(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  // Format values based on type
  formatValue(value) {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') {
      if (value > 1000000) {
        return (value / 1000000).toFixed(2) + 'M';
      } else if (value > 1000) {
        return (value / 1000).toFixed(2) + 'K';
      }
      return value.toLocaleString();
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return value.toString();
  }

  // Add a table to the PDF
  addTable(tableConfig) {
    this.checkPageBreak(50);
    
    // Add title
    this.doc.setFontSize(12);
    this.doc.setFont(undefined, 'bold');
    this.doc.text(tableConfig.title, this.margin, this.currentY);
    this.currentY += 10;

    if (!tableConfig.data || tableConfig.data.length === 0) {
      this.doc.setFont(undefined, 'normal');
      this.doc.setFontSize(10);
      this.doc.text('No data available', this.margin, this.currentY);
      this.currentY += 15;
      return;
    }

    // Add table using autoTable
    autoTable(this.doc, {
      head: [tableConfig.headers],
      body: tableConfig.data,
      startY: this.currentY,
      margin: { left: this.margin, right: this.margin },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [11, 78, 93], // Match your app's color scheme
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      didDrawPage: (data) => {
        this.currentY = data.cursor.y + 10;
      }
    });
  }

  // Generate the complete PDF report
  async generateReport() {
    try {
      // Add header to first page
      this.addHeader();

      // Get all cached data
      const cacheStats = this.cache.getCacheStats();
      console.log('Cache stats for PDF generation:', cacheStats);
      console.log('Full cache object in PDF generator:', this.cache);

      let hasData = false;

      // Process Google Ads data
      if (cacheStats.adsStats && Object.keys(cacheStats.adsStats).length > 0) {
        this.checkPageBreak(30);
        this.doc.setFontSize(14);
        this.doc.setFont(undefined, 'bold');
        this.doc.text('Google Ads Data', this.margin, this.currentY);
        this.currentY += 15;

        console.log('Processing ads cache entries...');
        console.log('All cache keys:', cacheStats.allKeys);

        // Iterate through all ads cache entries
        cacheStats.allKeys.forEach(key => {
          if (key.startsWith('ads_')) {
            console.log(`Processing cache key: ${key}`);
            
            // Get data using the raw cache access method
            const data = this.cache.getRawCacheData(key);
            console.log(`Raw cache data for ${key}:`, data);
            
            if (data) {
              const keyParts = key.split('_');
              const customerId = keyParts[1];
              const period = keyParts[2];
              const endpoint = keyParts.slice(3).join('_');
              
              const tables = this.processGoogleAdsData(data, customerId, period, endpoint);
              console.log(`Generated ${tables.length} tables for ${key}`);
              tables.forEach(table => {
                this.addTable(table);
                hasData = true;
              });
            } else {
              console.log(`No data found for ${key}`);
            }
          }
        });
      } else {
        console.log('No ads stats found:', cacheStats.adsStats);
      }

      // Process Google Analytics data
      if (cacheStats.analyticsStats && Object.keys(cacheStats.analyticsStats).length > 0) {
        this.checkPageBreak(30);
        this.doc.setFontSize(14);
        this.doc.setFont(undefined, 'bold');
        this.doc.text('Google Analytics Data', this.margin, this.currentY);
        this.currentY += 15;

        // Iterate through all analytics cache entries
        cacheStats.allKeys.forEach(key => {
          if (key.startsWith('analytics_')) {
            const data = this.cache.getRawCacheData(key);
            console.log(`Processing analytics cache entry: ${key}`, data);
            
            if (data) {
              const parts = key.split('_');
              const propertyId = parts[1];
              const period = parts[2];
              const endpoint = parts.slice(3).join('_');
              
              const tables = this.processGoogleAnalyticsData(data, propertyId, period, endpoint);
              tables.forEach(table => {
                this.addTable(table);
                hasData = true;
              });
            }
          }
        });
      }

      // If no data found, add a message
      if (!hasData) {
        this.checkPageBreak(30);
        this.doc.setFontSize(12);
        this.doc.setFont(undefined, 'normal');
        this.doc.text('No cached data available for report generation.', this.margin, this.currentY);
        this.doc.text('Please navigate through the dashboard to load data first.', this.margin, this.currentY + 10);
        this.doc.text(`Total cache keys found: ${cacheStats.totalKeys}`, this.margin, this.currentY + 20);
        this.doc.text(`Ads entries: ${Object.keys(cacheStats.adsStats).length}`, this.margin, this.currentY + 30);
        this.doc.text(`Analytics entries: ${Object.keys(cacheStats.analyticsStats).length}`, this.margin, this.currentY + 40);
      }

      // Add footer with page numbers
      const pageCount = this.doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        this.doc.setPage(i);
        this.doc.setFontSize(8);
        this.doc.setFont(undefined, 'normal');
        this.doc.text(
          `Page ${i} of ${pageCount}`, 
          this.doc.internal.pageSize.width - 40, 
          this.doc.internal.pageSize.height - 10
        );
      }

      return this.doc;
    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw error;
    }
  }
}

// Standalone function to generate and download report
export const generateAndDownloadReport = async (cache, user) => {
  try {
    const generator = new PDFReportGenerator(cache, user);
    const doc = await generator.generateReport();
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `analytics-report-${timestamp}.pdf`;
    
    // Download the PDF
    doc.save(filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('Failed to generate PDF report:', error);
    return { success: false, error: error.message };
  }
};