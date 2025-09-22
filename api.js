// The Fifth Verse Pincode API Handler
// Processes pincode lookup requests and returns JSON responses

let pincodeData = null;
let dataLoaded = false;

// Load the pincode data
async function loadPincodeData() {
    if (dataLoaded) return pincodeData;
    
    try {
        const response = await fetch('./pincode-lookup.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        pincodeData = await response.json();
        dataLoaded = true;
        return pincodeData;
    } catch (error) {
        console.error('Failed to load pincode data:', error);
        throw error;
    }
}

// Get query parameter from URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Validate pincode format
function isValidPincode(pincode) {
    return /^\d{6}$/.test(pincode);
}

// Generate API response
function createResponse(success, pincode, city = '', state = '', message = '') {
    return {
        success: success,
        pincode: pincode,
        city: city,
        state: state,
        message: message,
        timestamp: new Date().toISOString()
    };
}

// Main API handler
async function handlePincodeRequest() {
    try {
        const pincode = getQueryParam('pincode');
        
        // Validate pincode parameter
        if (!pincode) {
            return createResponse(false, '', '', '', 'Missing pincode parameter. Usage: ?pincode=XXXXXX');
        }

        if (!isValidPincode(pincode)) {
            return createResponse(false, pincode, '', '', 'Invalid pincode format. Must be exactly 6 digits.');
        }

        // Load data if not already loaded
        await loadPincodeData();
        
        if (!pincodeData) {
            return createResponse(false, pincode, '', '', 'Service temporarily unavailable. Please try again later.');
        }

        // Look up the pincode
        const result = pincodeData[pincode];
        
        if (!result) {
            return createResponse(false, pincode, '', '', 'Pincode not found in database');
        }

        // Return successful response
        return createResponse(
            true, 
            pincode, 
            result.district || '', 
            result.state || '', 
            'Pincode found successfully'
        );

    } catch (error) {
        console.error('API Error:', error);
        return createResponse(false, '', '', '', 'Internal server error');
    }
}

// Initialize API when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const result = await handlePincodeRequest();
        
        // Set response headers for JSON
        const meta = document.createElement('meta');
        meta.setAttribute('http-equiv', 'Content-Type');
        meta.setAttribute('content', 'application/json; charset=utf-8');
        document.head.appendChild(meta);
        
        // Output JSON response
        document.body.innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
        
        // Add CORS headers for cross-origin requests
        const corsStyle = document.createElement('style');
        corsStyle.textContent = `
            body { 
                font-family: monospace; 
                margin: 20px; 
                background: #f8f9fa;
            }
            pre { 
                background: white; 
                padding: 20px; 
                border-radius: 8px; 
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                border-left: 4px solid ${result.success ? '#28a745' : '#dc3545'};
            }
        `;
        document.head.appendChild(corsStyle);
        
    } catch (error) {
        console.error('Initialization error:', error);
        const errorResponse = createResponse(false, '', '', '', 'Failed to initialize API');
        document.body.innerHTML = `<pre>${JSON.stringify(errorResponse, null, 2)}</pre>`;
    }
});
