/**
 * Distribution Engine for generating answers for N responses
 */

/**
 * Fisher-Yates array shuffle helper
 */
function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Weighted random choice based on weights array/object
 * @param {Array<string>} options 
 * @param {Object} weightsMap - Map of option string -> percentage/weight number
 */
function pickWeightedRandom(options, weightsMap) {
  let totalWeight = 0;
  const weights = options.map(opt => {
    const w = parseFloat(weightsMap && weightsMap[opt] !== undefined ? weightsMap[opt] : 0);
    totalWeight += w;
    return w;
  });

  if (totalWeight <= 0) {
    // Fallback to uniform random
    return options[Math.floor(Math.random() * options.length)];
  }

  let rand = Math.random() * totalWeight;
  for (let i = 0; i < options.length; i++) {
    if (rand < weights[i]) {
      return options[i];
    }
    rand -= weights[i];
  }
  return options[options.length - 1];
}

/**
 * Generate Exact Count array for Multiple Choice options across totalResponses
 * @param {Array<string>} options 
 * @param {Object} countsMap - Map of option string -> target count or weight
 * @param {number} totalResponses 
 * @returns {Array<string>} Array of size totalResponses containing exact counts shuffled
 */
function generateExactCountDistribution(options, countsMap, totalResponses) {
  if (!options || options.length === 0) return [];

  // Compute specified counts/weights
  let sumEntered = 0;
  const rawCounts = options.map(opt => {
    const val = parseFloat(countsMap && countsMap[opt] !== undefined ? countsMap[opt] : 0);
    sumEntered += val;
    return val;
  });

  const resultList = [];

  if (sumEntered <= 0) {
    // Equal distribution fallback
    const perOpt = Math.floor(totalResponses / options.length);
    options.forEach((opt, idx) => {
      const cnt = (idx === options.length - 1) ? totalResponses - (perOpt * (options.length - 1)) : perOpt;
      for (let i = 0; i < cnt; i++) resultList.push(opt);
    });
  } else {
    // Normalize entered values to totalResponses
    let allocated = 0;
    const exactCounts = rawCounts.map((val, idx) => {
      if (idx === options.length - 1) {
        return totalResponses - allocated;
      }
      const countForOpt = Math.round((val / sumEntered) * totalResponses);
      allocated += countForOpt;
      return countForOpt;
    });

    options.forEach((opt, idx) => {
      const cnt = Math.max(0, exactCounts[idx]);
      for (let i = 0; i < cnt; i++) {
        resultList.push(opt);
      }
    });

    // Adjust in case rounding produced slightly more or fewer than totalResponses
    while (resultList.length < totalResponses) {
      resultList.push(options[0]);
    }
    while (resultList.length > totalResponses) {
      resultList.pop();
    }
  }

  // Shuffle so distribution is random across responses 1..N
  return shuffleArray(resultList);
}

module.exports = {
  shuffleArray,
  pickWeightedRandom,
  generateExactCountDistribution
};
