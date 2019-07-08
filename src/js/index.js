import PerformanceMeasure from './performance';

const getInstance = (options) => {
  return new PerformanceMeasure(options);
};

export {getInstance};