"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const https_1 = __importDefault(require("https"));
class WhatsAppService {
    static getAccessToken() {
        return (process.env.WHATSAPP_ACCESS_TOKEN || '').trim();
    }
    static getPhoneNumberId() {
        return (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
    }
    static getApiVersion() {
        return (process.env.WHATSAPP_API_VERSION || 'v21.0').trim();
    }
    /**
     * Checks if WhatsApp Cloud API credentials are fully configured
     */
    static isConfigured() {
        const token = this.getAccessToken();
        const phoneId = this.getPhoneNumberId();
        return Boolean(token && phoneId && token !== 'YOUR_WHATSAPP_ACCESS_TOKEN');
    }
    /**
     * Returns non-sensitive configuration diagnostics for the frontend
     */
    static getConfigStatus() {
        const configured = this.isConfigured();
        const phoneId = this.getPhoneNumberId();
        const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
        const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL || '';
        return {
            configured,
            apiVersion: this.getApiVersion(),
            phoneNumberId: phoneId ? `${phoneId.slice(0, 4)}...${phoneId.slice(-4)}` : null,
            businessAccountId: wabaId ? `${wabaId.slice(0, 4)}...${wabaId.slice(-4)}` : null,
            webhookUrl: webhookUrl || '/api/whatsapp/webhook',
            statusMessage: configured
                ? 'WhatsApp Business API is configured and operational.'
                : 'WhatsApp API is not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in backend/.env.'
        };
    }
    /**
     * Normalizes phone numbers to standard WhatsApp E.164 digits without + or symbols.
     * e.g., "+91 98450-12345" -> "919845012345"
     * e.g., "9845012345" (India 10 digits) -> "919845012345"
     */
    static normalizePhoneNumber(rawPhone) {
        if (!rawPhone)
            return '';
        let digits = rawPhone.replace(/\D/g, '');
        // Remove leading zeros
        digits = digits.replace(/^0+/, '');
        // If 10 digits (Standard Indian mobile), prepend country code 91
        if (digits.length === 10 && /^[6-9]/.test(digits)) {
            return `91${digits}`;
        }
        return digits;
    }
    /**
     * Validates if a phone number is a potentially valid WhatsApp recipient
     */
    static isValidPhoneNumber(rawPhone) {
        const normalized = this.normalizePhoneNumber(rawPhone);
        return Boolean(normalized && normalized.length >= 10 && normalized.length <= 15);
    }
    /**
     * Helper to make HTTPS requests to Meta Graph API
     */
    static makeGraphApiRequest(endpoint, payload) {
        return new Promise((resolve, reject) => {
            const token = this.getAccessToken();
            const payloadString = JSON.stringify(payload);
            const options = {
                hostname: 'graph.facebook.com',
                port: 443,
                path: `/${this.getApiVersion()}/${endpoint}`,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payloadString)
                }
            };
            const req = https_1.default.request(options, (res) => {
                let responseBody = '';
                res.on('data', chunk => responseBody += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseBody);
                        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(parsed);
                        }
                        else {
                            const errorMessage = parsed.error?.message || `WhatsApp API error: HTTP ${res.statusCode}`;
                            const errorCode = parsed.error?.code || res.statusCode;
                            const errorObj = new Error(errorMessage);
                            errorObj.code = errorCode;
                            errorObj.type = parsed.error?.type;
                            errorObj.subcode = parsed.error?.error_subcode;
                            errorObj.raw = parsed;
                            reject(errorObj);
                        }
                    }
                    catch (e) {
                        reject(new Error(`Failed to parse WhatsApp API response: ${responseBody}`));
                    }
                });
            });
            req.on('error', (err) => {
                reject(new Error(`Network error connecting to WhatsApp Cloud API: ${err.message}`));
            });
            req.write(payloadString);
            req.end();
        });
    }
    /**
     * Sends a two-way free-form text message via WhatsApp Cloud API
     */
    static async sendWhatsAppMessage(options) {
        const { to, messageText, previewUrl = false } = options;
        const normalizedTo = this.normalizePhoneNumber(to);
        if (!normalizedTo) {
            throw new Error('Invalid recipient phone number');
        }
        if (!messageText || !messageText.trim()) {
            throw new Error('Message text cannot be empty');
        }
        if (!this.isConfigured()) {
            throw new Error('WhatsApp API is not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in backend/.env.');
        }
        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: normalizedTo,
            type: 'text',
            text: {
                preview_url: previewUrl,
                body: messageText
            }
        };
        const result = await this.makeGraphApiRequest(`${this.getPhoneNumberId()}/messages`, payload);
        const messageId = result.messages?.[0]?.id;
        if (!messageId) {
            throw new Error('WhatsApp API succeeded but did not return a message ID');
        }
        return {
            success: true,
            messageId,
            to: normalizedTo,
            status: 'SENT',
            raw: result
        };
    }
    /**
     * Sends an approved WhatsApp Business API template message
     */
    static async sendWhatsAppTemplate(options) {
        const { to, templateName, languageCode = 'en', components = [] } = options;
        const normalizedTo = this.normalizePhoneNumber(to);
        if (!normalizedTo) {
            throw new Error('Invalid recipient phone number');
        }
        if (!templateName) {
            throw new Error('Template name is required');
        }
        if (!this.isConfigured()) {
            throw new Error('WhatsApp API is not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in backend/.env.');
        }
        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: normalizedTo,
            type: 'template',
            template: {
                name: templateName,
                language: {
                    code: languageCode
                }
            }
        };
        if (components && components.length > 0) {
            payload.template.components = components;
        }
        const result = await this.makeGraphApiRequest(`${this.getPhoneNumberId()}/messages`, payload);
        const messageId = result.messages?.[0]?.id;
        if (!messageId) {
            throw new Error('WhatsApp API succeeded but did not return a message ID');
        }
        return {
            success: true,
            messageId,
            to: normalizedTo,
            status: 'SENT',
            raw: result
        };
    }
    /**
     * Sends media (image, document, audio, video) via WhatsApp Cloud API
     */
    static async sendWhatsAppMedia(options) {
        const { to, mediaType, mediaUrl, caption, filename } = options;
        const normalizedTo = this.normalizePhoneNumber(to);
        if (!normalizedTo) {
            throw new Error('Invalid recipient phone number');
        }
        if (!mediaUrl) {
            throw new Error('Media URL is required');
        }
        if (!this.isConfigured()) {
            throw new Error('WhatsApp API is not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in backend/.env.');
        }
        const mediaPayload = {
            link: mediaUrl
        };
        if (caption && (mediaType === 'image' || mediaType === 'document' || mediaType === 'video')) {
            mediaPayload.caption = caption;
        }
        if (filename && mediaType === 'document') {
            mediaPayload.filename = filename;
        }
        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: normalizedTo,
            type: mediaType,
            [mediaType]: mediaPayload
        };
        const result = await this.makeGraphApiRequest(`${this.getPhoneNumberId()}/messages`, payload);
        const messageId = result.messages?.[0]?.id;
        if (!messageId) {
            throw new Error('WhatsApp API succeeded but did not return a message ID');
        }
        return {
            success: true,
            messageId,
            to: normalizedTo,
            status: 'SENT',
            raw: result
        };
    }
}
exports.WhatsAppService = WhatsAppService;
