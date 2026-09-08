"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateLeadPriority = calculateLeadPriority;
function calculateLeadPriority(lead) {
    let score = 0;
    const reasons = [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const threeDaysFuture = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const sevenDaysFuture = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    // -------------------------------------------------------------
    // A. LEAD STATUS
    // -------------------------------------------------------------
    const st = (lead.status || '').trim();
    const stLower = st.toLowerCase();
    if (st === 'Today Come to Join' || st === 'Expected Today' || stLower.includes('today come')) {
        score += 40;
        reasons.push('High-value status: Today Come to Join (+40)');
    }
    else if (st === 'Registration Pending' || stLower.includes('registration pending')) {
        score += 35;
        reasons.push('High-value status: Registration Pending (+35)');
    }
    else if (st === 'Trial Scheduled' || stLower.includes('trial scheduled')) {
        score += 30;
        reasons.push('High-value status: Trial Scheduled (+30)');
    }
    else if (st === 'Contacted - Interested (Need Time)' || stLower.includes('need time')) {
        score += 25;
        reasons.push('High-value status: Interested (Need Time) (+25)');
    }
    else if (st === 'Interested' || stLower.includes('interested')) {
        score += 20;
        reasons.push('Lead showed strong interest (+20)');
    }
    else if (st === 'Contacted' || stLower.includes('contacted')) {
        score += 15;
        reasons.push('Lead contacted (+15)');
    }
    else if (st === 'Follow-up' || stLower.includes('follow')) {
        score += 15;
        reasons.push('Active follow-up stage (+15)');
    }
    else if (st === 'New' || stLower === 'new') {
        score += 10;
        reasons.push('Fresh inquiry (+10)');
    }
    else if (st === 'Call - Not Attended' || stLower.includes('not attend')) {
        score += 5;
        reasons.push('Call pending callback (+5)');
    }
    else if (st === 'Converted' || stLower.includes('convert') || stLower.includes('joined')) {
        score += 50;
        reasons.push('Converted student (+50)');
    }
    // -------------------------------------------------------------
    // B. FOLLOW-UP
    // -------------------------------------------------------------
    let nextDate = null;
    if (lead.nextFollowUpAt) {
        nextDate = new Date(lead.nextFollowUpAt);
    }
    else if (lead.followups && lead.followups.length > 0) {
        const scheduled = lead.followups.find(f => f.status === 'SCHEDULED') || lead.followups[0];
        if (scheduled?.followupDate)
            nextDate = new Date(scheduled.followupDate);
    }
    if (nextDate && !isNaN(nextDate.getTime())) {
        if (nextDate >= todayStart && nextDate <= todayEnd) {
            score += 25;
            reasons.push('Follow-up due today (+25)');
        }
        else if (nextDate < todayStart) {
            score += 20;
            reasons.push('Follow-up is overdue (+20)');
        }
    }
    if (lead.followups && lead.followups.length > 1) {
        score += 10;
        reasons.push(`Multiple follow-ups logged (${lead.followups.length}) (+10)`);
    }
    let lastContact = null;
    if (lead.lastCommunicationAt) {
        lastContact = new Date(lead.lastCommunicationAt);
    }
    else if (lead.communications && lead.communications.length > 0) {
        const latest = lead.communications[0];
        if (latest?.communicationDate)
            lastContact = new Date(latest.communicationDate);
    }
    if (lastContact && !isNaN(lastContact.getTime()) && lastContact >= threeDaysAgo) {
        score += 15;
        reasons.push('Recent contact within 3 days (+15)');
    }
    // -------------------------------------------------------------
    // C. JOINING INTENT
    // -------------------------------------------------------------
    const joinDateRaw = lead.expectedJoiningDate || lead.expectedJoinDate;
    if (joinDateRaw) {
        const joinDate = new Date(joinDateRaw);
        if (!isNaN(joinDate.getTime())) {
            if (joinDate >= todayStart && joinDate <= todayEnd) {
                score += 30;
                reasons.push('Expected joining date is today (+30)');
            }
            else if (joinDate > todayEnd && joinDate <= threeDaysFuture) {
                score += 25;
                reasons.push('Expected joining within 3 days (+25)');
            }
            else if (joinDate > threeDaysFuture && joinDate <= sevenDaysFuture) {
                score += 15;
                reasons.push('Expected joining within 7 days (+15)');
            }
        }
    }
    // -------------------------------------------------------------
    // D. TRAINING REQUIREMENT
    // -------------------------------------------------------------
    const req = (lead.trainingRequirement || '').trim();
    if (req === 'Both Licence + Driving' || req.toLowerCase().includes('both')) {
        score += 15;
        reasons.push('High-value course: Both Licence + Driving (+15)');
    }
    else if (req === 'Driving Only' || req.toLowerCase().includes('driving only')) {
        score += 10;
        reasons.push('Standard course: Driving Only (+10)');
    }
    else if (req === 'Licence Only' || req.toLowerCase().includes('licence')) {
        score += 5;
        reasons.push('RTO package: Licence Only (+5)');
    }
    // -------------------------------------------------------------
    // E. LEAD SOURCE / CAMPAIGN (Secondary Metric)
    // -------------------------------------------------------------
    const src = (lead.leadSource || '').toLowerCase();
    const cmp = (lead.campaign || '').toLowerCase();
    if (src.includes('direct') || src.includes('whatsapp') || src.includes('muthu') || src.includes('priya')) {
        score += 10;
        reasons.push(`High-intent direct referral channel: ${lead.leadSource} (+10)`);
    }
    else if (src.includes('facebook') || src.includes('instagram') || src.includes('meta')) {
        score += 5;
        reasons.push(`Digital ad response channel: ${lead.leadSource} (+5)`);
    }
    else if (src) {
        score += 5;
        reasons.push(`Inquiry source: ${lead.leadSource} (+5)`);
    }
    if (cmp.includes('anniversary') || cmp.includes('trial') || cmp.includes('vinayagar') || cmp.includes('offer')) {
        score += 5;
        reasons.push(`Active campaign promotion: ${lead.campaign} (+5)`);
    }
    // -------------------------------------------------------------
    // F. CONTACT ACTIVITY (Actual DB Communications)
    // -------------------------------------------------------------
    if (lead.communications && lead.communications.length > 0) {
        let answeredAdded = false;
        let waRepliedAdded = false;
        let callbackAdded = false;
        let joinInfoAdded = false;
        let trialAdded = false;
        for (const comm of lead.communications) {
            const commText = `${comm.notes || ''} ${comm.subject || ''} ${comm.communicationType || ''}`.toLowerCase();
            if (!trialAdded && (commText.includes('trial') || commText.includes('demo') || commText.includes('test drive'))) {
                score += 20;
                reasons.push('Lead requested trial session (+20)');
                trialAdded = true;
            }
            if (!callbackAdded && (commText.includes('callback') || commText.includes('call back') || commText.includes('call again'))) {
                score += 15;
                reasons.push('Lead requested callback (+15)');
                callbackAdded = true;
            }
            if (!joinInfoAdded && (commText.includes('fee') || commText.includes('admission') || commText.includes('joining') || commText.includes('register'))) {
                score += 15;
                reasons.push('Lead requested joining / fee details (+15)');
                joinInfoAdded = true;
            }
            if (!waRepliedAdded && (comm.communicationType?.toLowerCase().includes('whatsapp') || commText.includes('whatsapp reply') || commText.includes('replied'))) {
                score += 10;
                reasons.push('Lead actively replied via WhatsApp (+10)');
                waRepliedAdded = true;
            }
            if (!answeredAdded && (commText.includes('answered') || commText.includes('talked') || commText.includes('discussed') || commText.includes('interested'))) {
                score += 10;
                reasons.push('Lead answered call and discussed details (+10)');
                answeredAdded = true;
            }
        }
    }
    // -------------------------------------------------------------
    // Score Level Mapping
    // -------------------------------------------------------------
    let level;
    if (score >= 60) {
        level = 'HIGH';
    }
    else if (score >= 30) {
        level = 'MEDIUM';
    }
    else {
        level = 'LOW';
    }
    return {
        score,
        level,
        reasons
    };
}
