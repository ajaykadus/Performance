import moment from 'moment';
import {formatBytes} from './util';

class PerformanceMeasure {
  constructor(options) {
    this.target = options.target;
    this.params = options.params;
    this.task = this.target.name;

  }

  calculate_time() {
    let startTime;
    let endTime;
    let duration;

    if (window.performance) {
      startTime = performance.now();
      this.target.call(null, this.params);
      endTime = performance.now();
      duration = endTime - startTime;
      return {
        startTime,
        endTime,
        duration
      };
    } else {
      console.warn('Performance is not supported');
      return 0;
    }
  }

  calculate_memory() {
    if (window.performance && window.performance.memory) {
      return this.formatMemoryInfo(performance.memory);
    } else {
      console.warn('No memory evaluation support')
      return '';
    }
  }

  formatMemoryInfo(info) {
    let formattedInfo = {};
    for (const key in info) {
      formattedInfo[key] = formatBytes(info[key]);
    }
    return formattedInfo;
  }

  getReport() {
    const memory = this.calculate_memory();
    const time = this.calculate_time();
    return {
      timeStatus: `${this.task || 'Task'} began on ${moment(time.startTime).format('hh:mm:ss')} and took ${moment(time.duration).format("mm:ss:SSS")} seconds ending at ${moment((time.endTime)).format('hh:mm:ss')}`,
      memoryStatus: `${this.task || 'Task'} has allocated ${memory.totalJSHeapSize} memory out of total available ${memory.jsHeapSizeLimit}, used memory out of allocation was ${memory.usedJSHeapSize}`
    }
  }

  assesPageLoad(pageNav) {
    if (pageNav.entryType === 'paint') {
      console.log(`Started paint at ${pageNav.startTime} for duration ${pageNav.duration}`);
      return;
    }
    // Measuring DNS lookup time
    let dnsTime = pageNav.domainLookupEnd - pageNav.domainLookupStart;
    // Quantifying total connection time
    let connectionTime = pageNav.connectEnd - pageNav.connectStart;
    let tlsTime = 0; // <-- Assume 0 by default

// Did any TLS stuff happen?
    if (pageNav.secureConnectionStart > 0) {
      // Awesome! Calculate it!
      tlsTime = pageNav.connectEnd - pageNav.secureConnectionStart;
    }

    // Cache seek plus response time
    let fetchTime = pageNav.responseEnd - pageNav.fetchStart;

// Service worker time plus response time
    let workerTime = 0;

    if (pageNav.workerStart > 0) {
      workerTime = pageNav.responseEnd - pageNav.workerStart;
    }

    // Request plus response time (network only)
    let totalTime = pageNav.responseEnd - pageNav.requestStart;

// Response time only (download)
    let downloadTime = pageNav.responseEnd - pageNav.responseStart;

// Time to First Byte (TTFB)
    let ttfb = pageNav.responseStart - pageNav.requestStart;

    // HTTP header size
    let headerSize = pageNav.transferSize - pageNav.encodedBodySize;

// Compression ratio
    let compressionRatio = pageNav.decodedBodySize / pageNav.encodedBodySize;
    console.log(dnsTime, tlsTime, fetchTime, workerTime, totalTime, downloadTime, ttfb, headerSize, compressionRatio)
  }

  evaluatePerformance() {
    // Should we even be doing anything with perf APIs?
    if ("performance" in window) {
      // OK, yes. Check PerformanceObserver support
      if ("PerformanceObserver" in window) {
// Instantiate the performance observer
        let perfObserver = new PerformanceObserver((list, obj) => {
          // Get all the resource entries collected so far
          // (You can also use getEntriesByType/getEntriesByName here)
          let entries = list.getEntries();

          // Iterate over entries
          for (let i = 0; i < entries.length; i++) {
            this.assesPageLoad(entries[i]);
            // Do the work!
          }
        });

// Run the observer
        perfObserver.observe({
          // Polls for Navigation and Resource Timing entries
          entryTypes: ["navigation", "resource", "paint"]
        });
      } else {
        // WOMP WOMP. Find another way. Or not.
      }
    }
  }
}

export default PerformanceMeasure;