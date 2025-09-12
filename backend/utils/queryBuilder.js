// MongoDB query builder utility
function buildMongoQuery(rules) {
  if (!rules || !rules.conditions) return {};
  
  const conditions = rules.conditions.map(condition => {
    const { field, operator, value } = condition;
    
    switch (operator) {
      case '>': return { [field]: { $gt: parseFloat(value) } };
      case '<': return { [field]: { $lt: parseFloat(value) } };
      case '>=': return { [field]: { $gte: parseFloat(value) } };
      case '<=': return { [field]: { $lte: parseFloat(value) } };
      case '=': return { [field]: value };
      case '!=': return { [field]: { $ne: value } };
      case 'contains': return { [field]: { $regex: value, $options: 'i' } };
      case 'not_contains': return { [field]: { $not: { $regex: value, $options: 'i' } } };
      case 'starts_with': return { [field]: { $regex: `^${value}`, $options: 'i' } };
      case 'ends_with': return { [field]: { $regex: `${value}$`, $options: 'i' } };
      case 'in': {
        const values = Array.isArray(value) ? value : value.split(',').map(v => v.trim());
        return { [field]: { $in: values } };
      }
      case 'not_in': {
        const values = Array.isArray(value) ? value : value.split(',').map(v => v.trim());
        return { [field]: { $nin: values } };
      }
      case 'inactive_days': {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - parseInt(value));
        return { lastVisit: { $lt: cutoff } };
      }
      case 'active_days': {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - parseInt(value));
        return { lastVisit: { $gte: cutoff } };
      }
      case 'between': {
        const [min, max] = value.split(',').map(v => parseFloat(v.trim()));
        return { [field]: { $gte: min, $lte: max } };
      }
      case 'exists': return { [field]: { $exists: value === 'true' } };
      default: return {};
    }
  });
  
  return rules.operator === 'AND' ? { $and: conditions } : { $or: conditions };
}

// Validate segment rules
function validateSegmentRules(rules) {
  if (!rules || typeof rules !== 'object') {
    throw new Error('Rules must be an object');
  }
  
  if (!['AND', 'OR'].includes(rules.operator)) {
    throw new Error('Operator must be AND or OR');
  }
  
  if (!Array.isArray(rules.conditions) || rules.conditions.length === 0) {
    throw new Error('Conditions must be a non-empty array');
  }
  
  const validFields = ['totalSpends', 'visits', 'lastVisit', 'email', 'name', 'tags', 'createdAt'];
  const validOperators = ['>', '<', '>=', '<=', '=', '!=', 'contains', 'not_contains', 'starts_with', 'ends_with', 'in', 'not_in', 'inactive_days', 'active_days', 'between', 'exists'];
  
  for (const condition of rules.conditions) {
    if (!condition.field || !validFields.includes(condition.field)) {
      throw new Error(`Invalid field: ${condition.field}`);
    }
    
    if (!condition.operator || !validOperators.includes(condition.operator)) {
      throw new Error(`Invalid operator: ${condition.operator}`);
    }
    
    if (condition.value === undefined || condition.value === null || condition.value === '') {
      throw new Error('Value is required for all conditions');
    }
  }
  
  return true;
}

module.exports = {
  buildMongoQuery,
  validateSegmentRules
};