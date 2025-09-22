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

  // Format period for display
  formatPeriod(period) {
    const periodMap = {
      'LAST_7_DAYS': 'Last 7 Days',
      'LAST_30_DAYS': 'Last 30 Days',
      'LAST_90_DAYS': 'Last 90 Days',
      'LAST_365_DAYS': 'Last 365 Days',
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days',
      '90d': 'Last 90 Days',
      '365d': 'Last 365 Days'
    };
    
    return periodMap[period] || period || 'Unknown Period';
  }

  // Format currency values
  formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) return '$0.00';
    
    // Handle values that are already in dollar format
    if (typeof value === 'string' && value.includes('$')) {
      return value;
    }
    
    const numValue = parseFloat(value);
    if (numValue === 0) return '$0.00';
    
    // If value seems to be in micros (very large number), convert it
    if (numValue > 1000000) {
      return `$${(numValue / 1000000).toFixed(2)}`;
    }
    
    return `$${numValue.toFixed(2)}`;
  }

  // Format percentage values
  formatPercentage(value) {
    if (value === null || value === undefined || isNaN(value)) return '0%';
    
    const numValue = parseFloat(value);
    if (numValue === 0) return '0%';
    
    // If value is already in percentage format (like 17.92), use as is
    // If value is in decimal format (like 0.1792), multiply by 100
    if (numValue <= 1) {
      return `${(numValue * 100).toFixed(2)}%`;
    } else {
      return `${numValue.toFixed(2)}%`;
    }
  }

  // Format large numbers
  formatLargeNumber(value) {
    if (value === null || value === undefined || isNaN(value)) return '0';
    
    const numValue = parseFloat(value);
    if (numValue >= 1000000) {
      return `${(numValue / 1000000).toFixed(1)}M`;
    } else if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(1)}K`;
    }
    return numValue.toLocaleString();
  }

  // Process Google Ads data to table format
  processGoogleAdsData(data, customerId, period, endpoint) {
    const tables = [];
    
    try {
      console.log(`Processing Google Ads data for endpoint: ${endpoint}`, data);
      
      // Skip only the keywords list endpoint that returns paginated keyword data
      // This excludes endpoints like 'ads_3220426249_LAST_30_DAYS_keywords' but keeps 'keyword-ideas', 'keyword-insights', etc.
      if (endpoint === 'keywords') {
        console.log('Skipping keywords list endpoint (paginated keyword data) as requested');
        return tables;
      }
      
      if (endpoint.includes('key-stats')) {
        if (data && typeof data === 'object') {
          const tableData = [];
          
          // Handle key stats with proper formatting
          const keyStatsMap = {
            'total_impressions': { label: 'Total Impressions', formatter: 'number' },
            'total_cost': { label: 'Total Cost', formatter: 'currency' },
            'total_clicks': { label: 'Total Clicks', formatter: 'number' },
            'conversion_rate': { label: 'Conversion Rate', formatter: 'percentage' },
            'total_conversions': { label: 'Total Conversions', formatter: 'number' },
            'avg_cost_per_click': { label: 'Avg. Cost Per Click', formatter: 'currency' },
            'cost_per_conversion': { label: 'Cost Per Conversion', formatter: 'currency' },
            'click_through_rate': { label: 'Click-Through Rate', formatter: 'percentage' }
          };

          Object.entries(data).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null && value.formatted) {
              // Use the formatted value if available
              tableData.push([
                value.label || this.formatKey(key),
                value.formatted
              ]);
            } else if (keyStatsMap[key]) {
              const config = keyStatsMap[key];
              let formattedValue = value;
              
              switch (config.formatter) {
                case 'currency':
                  formattedValue = this.formatCurrency(value);
                  break;
                case 'percentage':
                  formattedValue = this.formatPercentage(value);
                  break;
                case 'number':
                  formattedValue = this.formatLargeNumber(value);
                  break;
                default:
                  formattedValue = this.formatValue(value);
              }
              
              tableData.push([config.label, formattedValue]);
            } else if (!['summary', 'customer_id', 'period'].includes(key)) {
              // Handle other keys
              tableData.push([
                this.formatKey(key),
                this.formatValue(value)
              ]);
            }
          });

          tables.push({
            title: `Google Ads Key Stats (Customer: ${customerId}, Period: ${this.formatPeriod(period)})`,
            headers: ['Metric', 'Value'],
            data: tableData
          });
        }
      } else if (endpoint.includes('campaigns') || endpoint.includes('campaign-details')) {
        if (Array.isArray(data)) {
          const tableData = data.slice(0, 50).map((item) => [
            item.name || item.campaignName || 'Unknown Campaign',
            item.status || 'N/A',
            this.formatLargeNumber(item.impressions || 0),
            this.formatLargeNumber(item.clicks || 0),
            this.formatCurrency(item.cost || 0),
            this.formatPercentage(item.ctr || 0)
          ]);

          tables.push({
            title: `Google Ads Campaigns (Customer: ${customerId}, Period: ${this.formatPeriod(period)})`,
            headers: ['Campaign Name', 'Status', 'Impressions', 'Clicks', 'Cost', 'CTR'],
            data: tableData
          });
        }
      } else if (endpoint.includes('device-performance')) {
        if (Array.isArray(data)) {
          const tableData = data.map(item => [
            item.device || 'Unknown Device',
            this.formatLargeNumber(item.impressions || 0),
            this.formatLargeNumber(item.clicks || 0),
            this.formatCurrency(item.cost || 0),
            this.formatPercentage(item.ctr || 0)
          ]);

          tables.push({
            title: `Google Ads Device Performance (Customer: ${customerId}, Period: ${this.formatPeriod(period)})`,
            headers: ['Device', 'Impressions', 'Clicks', 'Cost', 'CTR'],
            data: tableData
          });
        }
      } else if (endpoint.includes('time-performance')) {
        if (Array.isArray(data)) {
          const tableData = data.slice(0, 30).map(item => [
            item.date || item.time || 'Unknown Date',
            this.formatLargeNumber(item.impressions || 0),
            this.formatLargeNumber(item.clicks || 0),
            this.formatCurrency(item.cost || 0)
          ]);

          tables.push({
            title: `Google Ads Time Performance (Customer: ${customerId}, Period: ${this.formatPeriod(period)})`,
            headers: ['Date', 'Impressions', 'Clicks', 'Cost'],
            data: tableData
          });
        }
      } else if (endpoint.includes('geographic')) {
        if (Array.isArray(data)) {
          const tableData = data.slice(0, 20).map(item => [
            item.location_name || item.location || 'Unknown Location',
            this.formatLargeNumber(item.impressions || 0),
            this.formatLargeNumber(item.clicks || 0),
            this.formatCurrency(item.cost || 0)
          ]);

          tables.push({
            title: `Google Ads Geographic Performance (Customer: ${customerId}, Period: ${this.formatPeriod(period)})`,
            headers: ['Location', 'Impressions', 'Clicks', 'Cost'],
            data: tableData
          });
        }
      } else if (endpoint.includes('performance')) {
        if (Array.isArray(data)) {
          const tableData = data.map(item => [
            item.name || item.metric || 'Unknown Metric',
            item.value || item.performance || 'N/A'
          ]);

          tables.push({
            title: `Google Ads Performance Metrics (Customer: ${customerId}, Period: ${this.formatPeriod(period)})`,
            headers: ['Metric', 'Value'],
            data: tableData
          });
        }
      } else {
        // Generic fallback for any other data, but limit complexity
        if (data && typeof data === 'object') {
          if (Array.isArray(data)) {
            // Limit array data to prevent overly large tables
            const tableData = data.slice(0, 20).map((item, index) => [
              index + 1,
              typeof item === 'string' ? item : JSON.stringify(item).substring(0, 100) + '...'
            ]);
            
            tables.push({
              title: `Google Ads Data - ${endpoint} (Customer: ${customerId}, Period: ${this.formatPeriod(period)})`,
              headers: ['Index', 'Data'],
              data: tableData
            });
          } else {
            const tableData = Object.entries(data)
              .filter(([key]) => !['summary', '_id', 'generated_at'].includes(key))
              .slice(0, 20)
              .map(([key, value]) => [
                this.formatKey(key),
                this.formatValue(value)
              ]);

            if (tableData.length > 0) {
              tables.push({
                title: `Google Ads Data - ${endpoint} (Customer: ${customerId}, Period: ${this.formatPeriod(period)})`,
                headers: ['Metric', 'Value'],
                data: tableData
              });
            }
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
      if (endpoint === 'overview' || endpoint === 'metrics') {
        if (data && typeof data === 'object') {
          const tableData = [];
          
          // Handle GA4 metrics with proper formatting
          const gaMetricsMap = {
            'totalUsers': { label: 'Total Users', formatter: 'number' },
            'sessions': { label: 'Sessions', formatter: 'number' },
            'engagedSessions': { label: 'Engaged Sessions', formatter: 'number' },
            'engagementRate': { label: 'Engagement Rate', formatter: 'percentage' },
            'averageSessionDuration': { label: 'Avg. Session Duration', formatter: 'duration' },
            'bounceRate': { label: 'Bounce Rate', formatter: 'percentage' },
            'pagesPerSession': { label: 'Pages Per Session', formatter: 'decimal' },
            'conversions': { label: 'Conversions', formatter: 'number' },
            'totalRevenue': { label: 'Total Revenue', formatter: 'currency' }
          };

          Object.entries(data).forEach(([key, value]) => {
            if (gaMetricsMap[key]) {
              const config = gaMetricsMap[key];
              let formattedValue = value;
              
              switch (config.formatter) {
                case 'currency':
                  formattedValue = this.formatCurrency(value);
                  break;
                case 'percentage':
                  formattedValue = this.formatPercentage(value);
                  break;
                case 'number':
                  formattedValue = this.formatLargeNumber(value);
                  break;
                case 'duration':
                  formattedValue = `${parseFloat(value || 0).toFixed(1)}s`;
                  break;
                case 'decimal':
                  formattedValue = parseFloat(value || 0).toFixed(2);
                  break;
                default:
                  formattedValue = this.formatValue(value);
              }
              
              tableData.push([config.label, formattedValue]);
            } else if (!['propertyId', 'propertyName', 'summary', '_id'].includes(key)) {
              tableData.push([
                this.formatKey(key),
                this.formatValue(value)
              ]);
            }
          });

          tables.push({
            title: `Google Analytics Overview (Property: ${propertyId}, Period: ${this.formatPeriod(period)})`,
            headers: ['Metric', 'Value'],
            data: tableData
          });
        }
      } else if (endpoint === 'traffic-sources') {
        if (Array.isArray(data)) {
          const tableData = data.slice(0, 10).map(item => [
            item.channel || item.source || 'N/A',
            this.formatLargeNumber(item.sessions || 0),
            this.formatLargeNumber(item.users || 0),
            this.formatPercentage(item.percentage || 0)
          ]);

          tables.push({
            title: `Google Analytics Traffic Sources (Property: ${propertyId}, Period: ${this.formatPeriod(period)})`,
            headers: ['Channel/Source', 'Sessions', 'Users', 'Percentage'],
            data: tableData
          });
        }
      } else if (endpoint === 'top-pages') {
        if (Array.isArray(data)) {
          const tableData = data.slice(0, 10).map(item => [
            item.title || item.pageTitle || 'N/A',
            item.path || item.pagePath || 'N/A',
            this.formatLargeNumber(item.pageViews || 0),
            `${parseFloat(item.avgTimeOnPage || 0).toFixed(1)}s`,
            this.formatPercentage(item.bounceRate || 0)
          ]);

          tables.push({
            title: `Google Analytics Top Pages (Property: ${propertyId}, Period: ${this.formatPeriod(period)})`,
            headers: ['Page Title', 'Path', 'Page Views', 'Avg. Time', 'Bounce Rate'],
            data: tableData
          });
        }
      } else if (endpoint === 'conversions') {
        if (Array.isArray(data)) {
          const tableData = data.slice(0, 15).map(item => [
            item.eventName || 'N/A',
            this.formatLargeNumber(item.conversions || 0),
            this.formatPercentage(item.conversionRate || 0),
            this.formatCurrency(item.conversionValue || 0)
          ]);

          tables.push({
            title: `Google Analytics Conversions (Property: ${propertyId}, Period: ${this.formatPeriod(period)})`,
            headers: ['Event Name', 'Conversions', 'Conv. Rate', 'Value'],
            data: tableData
          });
        }
      }
    } catch (error) {
      console.error('Error processing Google Analytics data:', error);
    }

    return tables;
  }

  // Process Meta/Facebook data to table format
  processMetaData(data, accountId, period, endpoint) {
    const tables = [];
    
    try {
      if (endpoint.includes('key-stats')) {
        if (data && typeof data === 'object') {
          const tableData = Object.entries(data)
            .filter(([key]) => !['accountId', 'accountName', 'summary', '_id'].includes(key))
            .map(([key, value]) => [
              this.formatKey(key),
              this.formatValue(value)
            ]);

          tables.push({
            title: `Meta Ads Key Stats (Account: ${accountId}, Period: ${this.formatPeriod(period)})`,
            headers: ['Metric', 'Value'],
            data: tableData
          });
        }
      } else if (endpoint.includes('campaigns')) {
        if (Array.isArray(data)) {
          const tableData = data.slice(0, 20).map(item => [
            item.name || 'N/A',
            item.status || 'N/A',
            this.formatLargeNumber(item.impressions || 0),
            this.formatLargeNumber(item.clicks || 0),
            this.formatCurrency(item.spend || 0),
            this.formatPercentage(item.ctr || 0)
          ]);

          tables.push({
            title: `Meta Ads Campaigns (Account: ${accountId}, Period: ${this.formatPeriod(period)})`,
            headers: ['Campaign Name', 'Status', 'Impressions', 'Clicks', 'Spend', 'CTR'],
            data: tableData
          });
        }
      }
    } catch (error) {
      console.error('Error processing Meta data:', error);
    }

    return tables;
  }

  // Format keys for better readability
  formatKey(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ')
      .trim();
  }

  // Format values based on type
  formatValue(value) {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') {
      return this.formatLargeNumber(value);
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') {
      return JSON.stringify(value).substring(0, 50) + '...';
    }
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
      columnStyles: {
        // Auto-adjust column widths based on content
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto', halign: 'right' },
        2: { cellWidth: 'auto', halign: 'right' },
        3: { cellWidth: 'auto', halign: 'right' },
        4: { cellWidth: 'auto', halign: 'right' },
        5: { cellWidth: 'auto', halign: 'right' }
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

      let hasData = false;

      // Process Google Ads data
      if (cacheStats.adsStats && Object.keys(cacheStats.adsStats).length > 0) {
        this.checkPageBreak(30);
        this.doc.setFontSize(14);
        this.doc.setFont(undefined, 'bold');
        this.doc.text('Google Ads Data', this.margin, this.currentY);
        this.currentY += 15;

        // Iterate through all ads cache entries
        cacheStats.allKeys.forEach(key => {
          if (key.startsWith('ads_')) {
            // Skip only the specific keywords endpoint that returns paginated keyword data
            const keyParts = key.split('_');
            const endpoint = keyParts.slice(3).join('_');
            
            if (endpoint === 'keywords') {
              console.log(`Skipping keywords endpoint: ${key}`);
              return; // Skip this iteration
            }
            
            const data = this.cache.getRawCacheData(key);
            
            if (data) {
              const customerId = keyParts[1];
              const period = keyParts[2];
              
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

      // Process Meta/Facebook data
      if (cacheStats.allKeys.some(key => key.startsWith('meta_') || key.startsWith('facebook_') || key.startsWith('instagram_'))) {
        this.checkPageBreak(30);
        this.doc.setFontSize(14);
        this.doc.setFont(undefined, 'bold');
        this.doc.text('Social Media Data', this.margin, this.currentY);
        this.currentY += 15;

        cacheStats.allKeys.forEach(key => {
          if (key.startsWith('meta_') || key.startsWith('facebook_') || key.startsWith('instagram_')) {
            const data = this.cache.getRawCacheData(key);
            
            if (data) {
              const parts = key.split('_');
              const accountId = parts[1];
              const period = parts[2];
              const endpoint = parts.slice(3).join('_');
              
              const tables = this.processMetaData(data, accountId, period, endpoint);
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