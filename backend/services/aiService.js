// AI Service - Contains all AI-powered functionality
// This can be enhanced to use real AI APIs like OpenAI or Anthropic

class AIService {
  
  // Convert text description to segment rules
  static convertTextToRules(description) {
    const rules = {
      operator: 'AND',
      conditions: []
    };
    
    const lowerDesc = description.toLowerCase();
    
    // Spending patterns
    const spendingMatch = lowerDesc.match(/spent?\s+(?:over|above|more\s+than|>\s*)?(?:₹|rs\.?\s*)?(\d+(?:,\d+)*(?:\.\d+)?)/);
    if (spendingMatch) {
      const amount = parseFloat(spendingMatch[1].replace(/,/g, ''));
      rules.conditions.push({
        field: 'totalSpends',
        operator: '>',
        value: amount.toString()
      });
    }
    
    // Visit patterns
    const visitMatch = lowerDesc.match(/(?:less\s+than|<|fewer\s+than)\s*(\d+)\s+visit/);
    if (visitMatch) {
      rules.conditions.push({
        field: 'visits',
        operator: '<',
        value: visitMatch[1]
      });
    }
    
    const moreVisitsMatch = lowerDesc.match(/(?:more\s+than|>\s*|over)\s*(\d+)\s+visit/);
    if (moreVisitsMatch) {
      rules.conditions.push({
        field: 'visits',
        operator: '>',
        value: moreVisitsMatch[1]
      });
    }
    
    // Inactivity patterns
    const inactiveMatch = lowerDesc.match(/(?:inactive|haven't\s+shopped|not\s+visited).*?(\d+)\s*(?:days?|months?)/);
    if (inactiveMatch) {
      let days = parseInt(inactiveMatch[1]);
      if (lowerDesc.includes('month')) {
        days *= 30; // Convert months to days
      }
      rules.conditions.push({
        field: 'lastVisit',
        operator: 'inactive_days',
        value: days.toString()
      });
    }
    
    // Email domain patterns
    const emailMatch = lowerDesc.match(/email.*?(@\w+\.\w+)/);
    if (emailMatch) {
      rules.conditions.push({
        field: 'email',
        operator: 'contains',
        value: emailMatch[1]
      });
    }
    
    // High value customers
    if (lowerDesc.includes('high value') || lowerDesc.includes('premium') || lowerDesc.includes('vip')) {
      rules.conditions.push({
        field: 'totalSpends',
        operator: '>',
        value: '10000'
      });
    }
    
    // New customers
    if (lowerDesc.includes('new customer') || lowerDesc.includes('first time')) {
      rules.conditions.push({
        field: 'visits',
        operator: '=',
        value: '1'
      });
    }
    
    return rules;
  }
  
  // Generate message suggestions based on objective
  static generateMessageSuggestions(objective, audienceSize) {
    const suggestions = [];
    const objLower = objective.toLowerCase();
    
    if (objLower.includes('inactive') || objLower.includes('win back') || objLower.includes('re-engagement')) {
      suggestions.push(
        "Hi {name}, we miss you! Come back with 20% off your next purchase.",
        "Hey {name}, it's been a while! Here's a special 15% discount just for you.",
        "{name}, your favorite items are waiting! Get 25% off this week only.",
        "We noticed you haven't shopped recently, {name}. Here's 30% off to welcome you back!",
        "Miss us, {name}? We miss you too! Exclusive 25% discount inside."
      );
    } else if (objLower.includes('high value') || objLower.includes('premium') || objLower.includes('vip')) {
      suggestions.push(
        "Hi {name}, thank you for being a valued customer! Enjoy VIP early access.",
        "{name}, as our premium customer, here's an exclusive 30% discount.",
        "Dear {name}, you deserve the best! Check out our new premium collection.",
        "Exclusive for you, {name}: Premium member early access to our sale.",
        "VIP treatment for {name}: Your personal 35% discount awaits."
      );
    } else if (objLower.includes('new') || objLower.includes('first time') || objLower.includes('welcome')) {
      suggestions.push(
        "Welcome {name}! Here's 15% off your next purchase.",
        "Hi {name}, thanks for joining us! Enjoy 20% off as our welcome gift.",
        "New customer special for {name}: Get 25% off your second purchase!",
        "Welcome aboard, {name}! Here's a special discount just for you.",
        "Hi {name}, great to have you! Your welcome discount is ready."
      );
    } else if (objLower.includes('sale') || objLower.includes('discount') || objLower.includes('offer')) {
      suggestions.push(
        "Don't miss out, {name}! Our biggest sale is here with up to 50% off.",
        "Flash sale alert, {name}! 24 hours only - save big now.",
        "{name}, exclusive offer: Buy 2 get 1 free on selected items!",
        "Limited time, {name}: Extra 40% off everything in your wishlist.",
        "Hey {name}, your personalized deals are ready! Save up to 60%."
      );
    } else if (objLower.includes('birthday') || objLower.includes('anniversary')) {
      suggestions.push(
        "Happy Birthday, {name}! Here's a special gift just for you.",
        "It's your special day, {name}! Enjoy 25% off everything.",
        "Birthday wishes from us, {name}! Your discount cake is ready 🎂",
        "Another year awesome, {name}! Here's your birthday surprise.",
        "Celebrating you today, {name}! Special birthday discount inside."
      );
    } else {
      suggestions.push(
        "Hi {name}, don't miss out on our latest offers!",
        "Hey {name}, something special is waiting for you!",
        "{name}, great deals are here! Shop now and save big.",
        "Exclusive for {name}: Check out what we've picked for you!",
        "Hi {name}, your personalized recommendations are ready!"
      );
    }
    
    // Add audience size context
    if (audienceSize && audienceSize < 100) {
      suggestions.push(`{name}, you're one of our select ${audienceSize} customers chosen for this exclusive offer!`);
    }
    
    return suggestions.slice(0, 5); // Return top 5 suggestions
  }
  
  // Generate performance summary for campaigns
  static generatePerformanceSummary(campaign, logs) {
    const totalSent = logs.filter(log => log.status === 'SENT').length;
    const totalFailed = logs.filter(log => log.status === 'FAILED').length;
    const totalPending = logs.filter(log => log.status === 'PENDING').length;
    const deliveryRate = totalSent + totalFailed > 0 ? (totalSent / (totalSent + totalFailed) * 100).toFixed(1) : 0;
    
    let summary = `Your campaign "${campaign.name}" targeted ${campaign.audienceSize.toLocaleString()} customers. `;
    
    if (totalSent > 0) {
      summary += `${totalSent.toLocaleString()} messages were successfully delivered (${deliveryRate}% delivery rate). `;
    }
    
    if (totalFailed > 0) {
      summary += `${totalFailed} messages failed to deliver. `;
    }
    
    if (totalPending > 0) {
      summary += `${totalPending} messages are still pending. `;
    }
    
    // Add performance insights
    if (deliveryRate >= 95) {
      summary += "Excellent delivery performance! ";
    } else if (deliveryRate >= 85) {
      summary += "Good delivery performance. ";
    } else if (deliveryRate < 70) {
      summary += "Consider reviewing your audience quality or messaging content. ";
    }
    
    // Add audience-specific insights
    if (campaign.segmentRules && campaign.segmentRules.conditions) {
      const highSpendCondition = campaign.segmentRules.conditions.find(
        c => c.field === 'totalSpends' && parseInt(c.value) > 10000
      );
      if (highSpendCondition) {
        summary += `High-value customers (>₹10K spend) typically show ${Math.min(98, parseFloat(deliveryRate) + 3)}% delivery rates, indicating strong engagement with premium segments. `;
      }
      
      const lowEngagementCondition = campaign.segmentRules.conditions.find(
        c => c.field === 'visits' && c.operator === '<' && parseInt(c.value) <= 2
      );
      if (lowEngagementCondition) {
        summary += "Low-engagement segments may require more compelling offers to improve response rates. ";
      }
    }
    
    return summary;
  }
  
  // Generate lookalike audience suggestions
  static generateLookalikeAudience(baseRules) {
    const suggestions = [];
    
    if (!baseRules || !baseRules.conditions) {
      return suggestions;
    }
    
    baseRules.conditions.forEach(condition => {
      if (condition.field === 'totalSpends') {
        const value = parseFloat(condition.value);
        
        // Similar spending range (±20%)
        suggestions.push({
          name: `Similar Spenders (±20%)`,
          description: `Customers with similar spending patterns`,
          rules: {
            operator: 'AND',
            conditions: [
              { field: 'totalSpends', operator: '>=', value: Math.floor(value * 0.8).toString() },
              { field: 'totalSpends', operator: '<=', value: Math.floor(value * 1.2).toString() }
            ]
          }
        });
        
        // Spending tier above
        if (value < 50000) {
          suggestions.push({
            name: `Higher Spenders`,
            description: `Customers who spend more than your base segment`,
            rules: {
              operator: 'AND',
              conditions: [
                { field: 'totalSpends', operator: '>', value: Math.floor(value * 1.5).toString() }
              ]
            }
          });
        }
      }
      
      if (condition.field === 'visits') {
        const visits = parseInt(condition.value);
        
        suggestions.push({
          name: `Similar Visit Frequency`,
          description: `Customers with similar visit patterns`,
          rules: {
            operator: 'AND',
            conditions: [
              { field: 'visits', operator: condition.operator, value: condition.value },
              { field: 'lastVisit', operator: 'active_days', value: '30' }
            ]
          }
        });
        
        // More engaged version
        if (visits < 10) {
          suggestions.push({
            name: `More Engaged Customers`,
            description: `Customers who visit more frequently`,
            rules: {
              operator: 'AND',
              conditions: [
                { field: 'visits', operator: '>', value: Math.max(visits + 2, 3).toString() }
              ]
            }
          });
        }
      }
      
      if (condition.field === 'lastVisit' && condition.operator === 'inactive_days') {
        const days = parseInt(condition.value);
        
        suggestions.push({
          name: `Recently Inactive`,
          description: `Customers who became inactive more recently`,
          rules: {
            operator: 'AND',
            conditions: [
              { field: 'lastVisit', operator: 'inactive_days', value: Math.floor(days / 2).toString() }
            ]
          }
        });
      }
    });
    
    return suggestions.slice(0, 4); // Return top 4 suggestions
  }
  
  // Generate optimal timing recommendations
  static generateOptimalTiming(audienceRules) {
    const recommendations = {
      bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
      bestHours: [10, 14, 16], // 10 AM, 2 PM, 4 PM
      timezone: 'Asia/Kolkata',
      confidence: 0.85,
      reasoning: 'Based on general engagement patterns, mid-week afternoons show highest open rates.'
    };
    
    // Adjust based on audience characteristics
    if (audienceRules && audienceRules.conditions) {
      const highSpendCondition = audienceRules.conditions.find(
        c => c.field === 'totalSpends' && parseInt(c.value) > 10000
      );
      
      if (highSpendCondition) {
        recommendations.bestDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'];
        recommendations.bestHours = [9, 13, 17]; // Business hours
        recommendations.reasoning = 'High-value customers typically engage better during business hours on weekdays. ';
        recommendations.confidence = 0.88;
      }
      
      const lowEngagementCondition = audienceRules.conditions.find(
        c => c.field === 'visits' && c.operator === '<' && parseInt(c.value) <= 2
      );
      
      if (lowEngagementCondition) {
        recommendations.bestDays = ['Friday', 'Saturday', 'Sunday'];
        recommendations.bestHours = [11, 15, 19]; // Weekend leisure hours
        recommendations.reasoning += 'Low-engagement customers may be more responsive during weekend leisure time. ';
        recommendations.confidence = 0.78;
      }
      
      const inactiveCondition = audienceRules.conditions.find(
        c => c.field === 'lastVisit' && c.operator === 'inactive_days'
      );
      
      if (inactiveCondition) {
        recommendations.bestHours = [12, 18, 20]; // Lunch and evening
        recommendations.reasoning += 'Inactive customers may need multiple touchpoints throughout the day. ';
      }
    }
    
    return recommendations;
  }
  
  // Enhanced AI features (requires API keys)
  static async enhancedTextToRules(description, apiKey) {
    // This would call OpenAI/Anthropic API for more sophisticated parsing
    // For now, fallback to rule-based approach
    if (!apiKey) {
      return this.convertTextToRules(description);
    }
    
    // TODO: Implement API call to AI service
    // const response = await openai.completions.create({...});
    // return processAIResponse(response);
    
    return this.convertTextToRules(description);
  }
  
  static async enhancedMessageGeneration(objective, audienceData, apiKey) {
    // This would use AI to generate more personalized messages
    if (!apiKey) {
      return this.generateMessageSuggestions(objective, audienceData.size);
    }
    
    // TODO: Implement API call for personalized message generation
    return this.generateMessageSuggestions(objective, audienceData.size);
  }
}

module.exports = AIService;