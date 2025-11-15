package com.search;

import java.io.Serializable;
import java.util.*;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;
import javax.faces.context.ExternalContext;
import javax.faces.context.FacesContext;
import javax.faces.model.SelectItem;

public class SelfServiceSettingsBBean implements Serializable {

    private static final long serialVersionUID = 1L;

    /* ===== NEW: Event Types dropdown ===== */
    private List<String> eventTypesList;
    private String selectedEventType;
    
    /* ===== NEW: Stores dropdown ===== */
    private List<String> storesList;
    private Map<String, Boolean> selectedStoresMap;
    private String selectedStoresString;

    /* ===== Event + Pickup dropdown lists ===== */
    private List<String> eventCodesList;
    private List<String> pickupTypeList;
    
    /* ===== NEW: Master list of all event codes by type ===== */
    private Map<String, List<String>> eventCodesByType;

    private Map<String, Boolean> selectedEventCodesMap;
    private Map<String, Boolean> selectedPickupTypeMap;

    /* ===== Hidden fields for submit ===== */
    private String selectedEventCodesString;
    private String selectedPickupTypesString;

    /* ===== Notification messages (chips + suggestions) ===== */
    private List<String> searchNotificationMessages;
    
    // ✅ Keep map for state tracking (needed for chip rendering)
    private Map<String, Boolean> selectedNotificationMap;
    
    // ✅ String to store selected notifications from frontend (client-side only until submit)
    private String selectedNotificationsString;

    /* Text user is currently typing in chip editor */
    private String chipQuery;
    public String getChipQuery() { return chipQuery; }
    public void setChipQuery(String chipQuery) { this.chipQuery = chipQuery; }

    /* Summary shown after submit */
    private String selectedSummary;
    public String getSelectedSummary() { return selectedSummary; }

    /* Tooltip map for Event Codes */
    private Map<String, String> eventCodeTooltips;
    public Map<String, String> getEventCodeTooltips() { return eventCodeTooltips; }

    @PostConstruct
    public void init() {
        // ===== NEW: Initialize Event Types =====
        eventTypesList = Arrays.asList(
            "All Types",
            "Account Management",
            "Transaction Processing",
            "System Notifications",
            "User Authentication",
            "Data Operations",
            "Delivery & Shipping"
        );
        
        selectedEventType = "All Types"; // Default selection
        
        // ===== NEW: Initialize Stores List =====
        storesList = Arrays.asList(
            "Store #001 - Downtown",
            "Store #002 - Uptown",
            "Store #003 - Westside",
            "Store #004 - Eastside",
            "Store #005 - Northgate",
            "Store #006 - Southgate",
            "Store #007 - Central Plaza",
            "Store #008 - Mall of America",
            "Store #009 - Riverside",
            "Store #010 - Airport",
            "Store #011 - University District",
            "Store #012 - Harbor View",
            "Store #013 - Mountain View",
            "Store #014 - Beach Boulevard",
            "Store #015 - Park Avenue",
            "Store #016 - Main Street",
            "Store #017 - Oak Ridge",
            "Store #018 - Pine Valley",
            "Store #019 - Maple Grove",
            "Store #020 - Cedar Hills",
            "Store #021 - Willow Creek",
            "Store #022 - Sunset Strip",
            "Store #023 - Golden Gate",
            "Store #024 - Silver Lake",
            "Store #025 - Crystal Bay",
            "Store #026 - Diamond Heights",
            "Store #027 - Pearl Harbor",
            "Store #028 - Ruby Square",
            "Store #029 - Emerald City",
            "Store #030 - Sapphire Point",
            "Store #031 - Topaz Plaza",
            "Store #032 - Jade Garden",
            "Store #033 - Coral Reef",
            "Store #034 - Amber Valley",
            "Store #035 - Onyx Tower",
            "Store #036 - Quartz Corner",
            "Store #037 - Granite Station",
            "Store #038 - Marble Arch",
            "Store #039 - Limestone Lane",
            "Store #040 - Sandstone Square"
        );
        
        selectedStoresMap = new LinkedHashMap<>();
        for (String store : storesList) {
            selectedStoresMap.put(store, false);
        }

        // ===== Initialize Event Codes by Type =====
        eventCodesByType = new LinkedHashMap<>();
        
        // Account Management
        eventCodesByType.put("Account Management", Arrays.asList(
            "EVT001 - Registration", "EVT004 - Activation", "EVT005 - Suspension", 
            "EVT006 - Reactivation", "EVT007 - Modification", "EVT028 - Authentication",
            "EVT029 - Authorization", "EVT030 - Logout", "EVT037 - Profile Update",
            "EVT042 - Account Lock", "EVT043 - Account Unlock", "EVT044 - Privacy Settings"
        ));
        
        // Transaction Processing
        eventCodesByType.put("Transaction Processing", Arrays.asList(
            "EVT002 - Payment", "EVT003 - Cancellation", "EVT008 - Upgrade",
            "EVT009 - Downgrade", "EVT010 - Transfer", "EVT011 - Renewal",
            "EVT049 - Generate Invoice", "EVT050 - Process Refund", "EVT051 - Issue Credit",
            "EVT052 - Apply Discount", "EVT053 - Remove Discount", "EVT054 - Tax Calculation"
        ));
        
        // System Notifications
        eventCodesByType.put("System Notifications", Arrays.asList(
            "EVT013 - Notification", "EVT014 - Alert", "EVT015 - Warning",
            "EVT016 - Error", "EVT017 - Success", "EVT026 - Confirmation",
            "EVT045 - Notification Settings", "EVT046 - Language Change", "EVT047 - Theme Change"
        ));
        
        // User Authentication
        eventCodesByType.put("User Authentication", Arrays.asList(
            "EVT027 - Verification", "EVT038 - Password Reset", "EVT039 - Email Verification",
            "EVT040 - Phone Verification", "EVT041 - Two-Factor Auth"
        ));
        
        // Data Operations
        eventCodesByType.put("Data Operations", Arrays.asList(
            "EVT031 - Session Start", "EVT032 - Session End", "EVT033 - Data Export",
            "EVT034 - Data Import", "EVT035 - File Upload", "EVT036 - File Download",
            "EVT048 - Export Report"
        ));
        
        // Delivery & Shipping
        eventCodesByType.put("Delivery & Shipping", Arrays.asList(
            "EVT055 - Shipping Label", "EVT056 - Tracking Update", "EVT057 - Delivery Confirmed",
            "EVT058 - Return Initiated", "EVT059 - Warranty Claim", "EVT060 - Support Ticket"
        ));
        
        // Processing Status (for remaining codes)
        List<String> processingStatus = Arrays.asList(
            "EVT012 - Expiration", "EVT018 - Pending", "EVT019 - Approved",
            "EVT020 - Rejected", "EVT021 - Processing", "EVT022 - Completed",
            "EVT023 - Failed", "EVT024 - Timeout", "EVT025 - Retry"
        );
        eventCodesByType.put("Processing Status", processingStatus);
        
        // Create "All Types" list containing all event codes
        List<String> allEventCodes = new ArrayList<>();
        for (List<String> codes : eventCodesByType.values()) {
            allEventCodes.addAll(codes);
        }
        // Remove duplicates and sort
        allEventCodes = new ArrayList<>(new LinkedHashSet<>(allEventCodes));
        Collections.sort(allEventCodes);
        eventCodesByType.put("All Types", allEventCodes);
        
        // Initialize eventCodesList based on default selection
        eventCodesList = new ArrayList<>(eventCodesByType.get(selectedEventType));

        // 55 Pickup Types (exceeds 35 limit for testing)
        pickupTypeList = Arrays.asList(
                // Original 30
                "Home Delivery","Store Pickup","Mail Order","Express Delivery",
                "Same Day Delivery","Next Day Delivery","Standard Shipping","Priority Shipping",
                "Overnight Shipping","International Shipping","Curbside Pickup","Drive-Through Pickup",
                "Locker Pickup","Counter Pickup","Pharmacy Pickup","In-Store Collection",
                "Click and Collect","Ship to Store","Local Delivery","Regional Delivery",
                "National Delivery","Courier Service","Postal Service","Parcel Locker",
                "Drop Box","Mobile Delivery","Scheduled Delivery","Weekend Delivery",
                "Evening Delivery","Morning Delivery",
                
                // Additional 25 pickup types (total 55)
                "Contactless Delivery","White Glove Service","Inside Delivery","Room of Choice",
                "Assembly Required","Installation Included","Freight Shipping","LTL Shipping",
                "FTL Shipping","Cold Chain Delivery","Temperature Controlled","Refrigerated Transport",
                "Hazmat Shipping","Oversized Item Delivery","Heavy Item Delivery","Signature Required",
                "Adult Signature Required","No Signature Required","Leave at Door","Doorstep Delivery",
                "Concierge Delivery","Scheduled Time Slot","2-Hour Window","4-Hour Window","All Day Window"
            );

        // 65 Notification Messages (exceeds 50 limit for testing)
        searchNotificationMessages = Arrays.asList(
                // Original 30 pharmacy notifications
                "Prescription ready for pickup",
                "Medicine out of stock – urgent!",
                "Refill reminder",
                "Order shipped",
                "Discount available: 20% off",
                "New prescription received (℞)",
                "Insurance claim approved",
                "Payment pending – pay @ counter",
                "Delivery scheduled",
                "Package delayed",
                "Appointment reminder",
                "Lab results ready",
                "Vaccination due",
                "Medication interaction alert",
                "Dosage change notification (5mg -> 10mg)",
                "Generic alternative available (Brand -> Generic)",
                "Prior authorization required",
                "Copay amount changed: ₹150 -> ₹200",
                "Pharmacy location changed",
                "Transfer request received",
                "Prescription expired",
                "Doctor consultation required",
                "Side effects reported",
                "Allergic reaction warning",
                "Temperature-sensitive item (2°C – 8°C)",
                "Controlled substance notice",
                "Refill limit reached (3/3)",
                "Insurance verification needed",
                "Signature required for delivery",
                "Special handling instructions",

                // Special character stress test (10 items)
                "! @ # $ % ^ & * ( ) _ + - = { } [ ] : ; \" ' < > / \\ | ? ~ `",
                "Math symbols: ± × ÷ √ ∞ ≠ ≥ ≤ π µ ∑ ∆ °C",
                "Arrows: -> <- => <= >> << ->> <<-",
                "URL: https://example.com/api?x=1&y=2",
                "JSON snippet: {\"key\":\"value\", \"count\":123}",
                "Path test: C:\\Program Files\\Java\\",
                "Slash variants: / \\ // \\\\ \\/",
                "Reserved chars test: & < > \" ' / \\",
                "Newline and tab test:\nLine 2\tTabbed text",

                // Additional 25 notifications (total 65)
                "Blood pressure medication reminder",
                "Diabetes monitoring supplies available",
                "Flu shot scheduled for tomorrow",
                "COVID-19 booster available",
                "Prescription transferred from another pharmacy",
                "Medication synchronization service offered",
                "Monthly vitamin subscription renewal",
                "Antibiotics course completion reminder",
                "Pain medication refill due in 3 days",
                "Inhaler replacement recommended",
                "Eye drops prescription filled",
                "Cholesterol medication adjustment needed",
                "Allergy season alert: antihistamines in stock",
                "Prescription discount card available",
                "Medicare Part D enrollment reminder",
                "Specialty medication requires cold storage",
                "Compounded medication ready in 24 hours",
                "Drug recall notice: Contact pharmacy immediately",
                "Insurance formulary change notification",
                "Mail order option available for this prescription",
                "Preferred pharmacy network savings: ₹500/month",
                "Medication therapy management consultation scheduled",
                "Travel medication pack available",
                "Pediatric dosing adjustment required",
                "Geriatric medication review available"
            );

        selectedEventCodesMap = new LinkedHashMap<>();
        for (String code : eventCodesList) {
            selectedEventCodesMap.put(code, false);
        }

        selectedPickupTypeMap = new LinkedHashMap<>();
        for (String type : pickupTypeList) {
            selectedPickupTypeMap.put(type, false);
        }

        selectedNotificationMap = new LinkedHashMap<>();
        for (String msg : searchNotificationMessages) {
            selectedNotificationMap.put(msg, false);
        }

        eventCodeTooltips = new HashMap<>();
        for (String code : allEventCodes) {
            eventCodeTooltips.put(code, "Tooltip for " + code);
        }
    }

    /* ===== NEW: Event Type Getters/Setters ===== */
    public SelectItem[] getEventTypesList() {
        SelectItem[] items = new SelectItem[eventTypesList.size()];
        for (int i = 0; i < eventTypesList.size(); i++) {
            items[i] = new SelectItem(eventTypesList.get(i), eventTypesList.get(i));
        }
        return items;
    }
    
    public String getSelectedEventType() {
        return selectedEventType;
    }
    
    public void setSelectedEventType(String selectedEventType) {
        System.out.println("========== Event Type Changed ==========");
        System.out.println("Old Type: " + this.selectedEventType);
        System.out.println("New Type: " + selectedEventType);
        
        this.selectedEventType = selectedEventType;
        
        // Update event codes list based on selected type
        if (selectedEventType != null && eventCodesByType.containsKey(selectedEventType)) {
            eventCodesList = new ArrayList<>(eventCodesByType.get(selectedEventType));
            
            // Rebuild the map with new event codes, preserving selections where possible
            Map<String, Boolean> oldSelections = new LinkedHashMap<>(selectedEventCodesMap);
            selectedEventCodesMap.clear();
            
            for (String code : eventCodesList) {
                // Preserve selection if the code was previously selected
                selectedEventCodesMap.put(code, oldSelections.getOrDefault(code, false));
            }
            
            System.out.println("Event codes updated. New count: " + eventCodesList.size());
        }
    }
    
    public void onEventTypeChange() {
        System.out.println("========== onEventTypeChange AJAX called ==========");
        // The setter already does the work, this method is just for AJAX callback
    }

    /* ===== NEW: Stores Getters/Setters ===== */
    public List<String> getStoresList() {
        return storesList;
    }

    public Map<String, Boolean> getSelectedStoresMap() {
        return selectedStoresMap;
    }

    public String getSelectedStoresString() {
        return selectedStoresString;
    }

    public void setSelectedStoresString(String val) {
        this.selectedStoresString = val;
        selectedStoresMap.replaceAll((k, v) -> false);
        if (val != null && !val.trim().isEmpty()) {
            for (String store : val.split(",")) {
                String s = store.trim();
                if (!s.isEmpty() && selectedStoresMap.containsKey(s)) {
                    selectedStoresMap.put(s, true);
                }
            }
        }
    }
    
    // Get comma-separated string of selected stores for display
    public String getSelectedStoresDisplayString() {
        String selected = selectedStoresMap.entrySet().stream()
                .filter(Map.Entry::getValue)
                .map(Map.Entry::getKey)
                .collect(Collectors.joining(", "));
        return selected.isEmpty() ? "None selected" : selected;
    }

    /* ===== Event Codes Getters/Setters ===== */
    public List<String> getEventCodesList() {
        return eventCodesList;
    }

    public Map<String, Boolean> getSelectedEventCodesMap() {
        return selectedEventCodesMap;
    }

    public List<String> getPickupTypeList() {
        return pickupTypeList;
    }

    public Map<String, Boolean> getSelectedPickupTypeMap() {
        return selectedPickupTypeMap;
    }

    public List<String> getSearchNotificationMessages() {
        return searchNotificationMessages;
    }

    public Map<String, Boolean> getSelectedNotificationMap() {
        return selectedNotificationMap;
    }

    /* ===== Hidden fields (string ↔ map sync) ===== */
    public String getSelectedEventCodesString() { return selectedEventCodesString; }
    public void setSelectedEventCodesString(String val) {
        this.selectedEventCodesString = val;
        selectedEventCodesMap.replaceAll((k, v) -> false);
        if (val != null && !val.trim().isEmpty()) {
            for (String code : val.split(",")) {
                String c = code.trim();
                if (!c.isEmpty() && selectedEventCodesMap.containsKey(c)) {
                    selectedEventCodesMap.put(c, true);
                }
            }
        }
    }

    public String getSelectedPickupTypesString() { return selectedPickupTypesString; }
    public void setSelectedPickupTypesString(String val) {
        this.selectedPickupTypesString = val;
        selectedPickupTypeMap.replaceAll((k, v) -> false);
        if (val != null && !val.trim().isEmpty()) {
            for (String type : val.split(",")) {
                String t = type.trim();
                if (!t.isEmpty() && selectedPickupTypeMap.containsKey(t)) {
                    selectedPickupTypeMap.put(t, true);
                }
            }
        }
    }

    // ✅ Getter and Setter for notifications string
    public String getSelectedNotificationsString() { 
        return selectedNotificationsString; 
    }
    
    public void setSelectedNotificationsString(String val) {
        System.out.println("========== setSelectedNotificationsString CALLED ==========");
        System.out.println("Received value: [" + val + "]");
        System.out.println("Value length: " + (val != null ? val.length() : 0));
        this.selectedNotificationsString = val;
        
        // ✅ Sync with map for rendering
        selectedNotificationMap.replaceAll((k, v) -> false);
        if (val != null && !val.trim().isEmpty()) {
            for (String notif : val.split(",")) {
                String n = notif.trim();
                if (!n.isEmpty() && selectedNotificationMap.containsKey(n)) {
                    selectedNotificationMap.put(n, true);
                }
            }
        }
    }

    // ✅ Get list of selected notifications from map
    public List<String> getSelectedNotificationList() {
        return selectedNotificationMap.entrySet().stream()
                .filter(Map.Entry::getValue)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    /* Summary */
    public String printSelections() {
        System.out.println("========== printSelections CALLED ==========");
        System.out.println("Event Type: [" + selectedEventType + "]");
        System.out.println("Stores String: [" + selectedStoresString + "]");
        System.out.println("Event Codes String: [" + selectedEventCodesString + "]");
        System.out.println("Pickup Types String: [" + selectedPickupTypesString + "]");
        System.out.println("Notifications String: [" + selectedNotificationsString + "]");
        
        String stores = selectedStoresMap.entrySet().stream()
                .filter(Map.Entry::getValue).map(Map.Entry::getKey)
                .collect(Collectors.joining(", "));

        String events = selectedEventCodesMap.entrySet().stream()
                .filter(Map.Entry::getValue).map(Map.Entry::getKey)
                .collect(Collectors.joining(", "));

        String pickups = selectedPickupTypeMap.entrySet().stream()
                .filter(Map.Entry::getValue).map(Map.Entry::getKey)
                .collect(Collectors.joining(", "));

        // ✅ Get notifications from map (already synced in setter)
        String notifs = selectedNotificationMap.entrySet().stream()
                .filter(Map.Entry::getValue).map(Map.Entry::getKey)
                .collect(Collectors.joining(", "));

        System.out.println("Final Event Type: [" + selectedEventType + "]");
        System.out.println("Final Stores: [" + stores + "]");
        System.out.println("Final Events: [" + events + "]");
        System.out.println("Final Pickups: [" + pickups + "]");
        System.out.println("Final Notifications: [" + notifs + "]");
        System.out.println("Final Notifications Count: " + getSelectedNotificationList().size());

        selectedSummary =
                "<b>Event Type:</b> " + selectedEventType + "<br/>" +
                "<b>Stores:</b> " + (stores.isEmpty() ? "None" : stores) + "<br/>" +
                "<b>Event Codes:</b> " + (events.isEmpty() ? "None" : events) + "<br/>" +
                "<b>Pickup Types:</b> " + (pickups.isEmpty() ? "None" : pickups) + "<br/>" +
                "<b>Notifications:</b> " + (notifs.isEmpty() ? "None" : notifs);

        System.out.println("========== printSelections COMPLETED ==========");
        return null;
    }

    /**
     * RichFaces AJAX: filter suggestions; return JSON via requestMap
     */
    public void fetchNotificationSuggestions() {
        System.out.println("========== fetchNotificationSuggestions CALLED ==========");
        System.out.println("chipQuery: [" + chipQuery + "]");
        
        ExternalContext ext = FacesContext.getCurrentInstance().getExternalContext();
        try {
            String q = chipQuery == null ? "" : chipQuery.trim().toLowerCase();

            List<String> filtered = q.isEmpty()
                    ? new ArrayList<>(searchNotificationMessages)
                    : searchNotificationMessages.stream()
                        .filter(m -> m.toLowerCase().contains(q))
                        .collect(Collectors.toList());

            System.out.println("Filtered results: " + filtered.size());

            StringBuilder json = new StringBuilder(filtered.size() * 32);
            json.append('[');
            for (int i = 0; i < filtered.size(); i++) {
                if (i > 0) json.append(',');
                json.append('"').append(escapeJson(filtered.get(i))).append('"');
            }
            json.append(']');

            String jsonResult = json.toString();
            ext.getRequestMap().put("notifJson", jsonResult);
            System.out.println("JSON result length: " + jsonResult.length());
            System.out.println("========== fetchNotificationSuggestions COMPLETED ==========");
        } catch (Exception e) {
            System.err.println("ERROR in fetchNotificationSuggestions: " + e.getMessage());
            e.printStackTrace();
            ext.getRequestMap().put("notifJson", "[]");
        }
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder();
        for (char c : s.toCharArray()) {
            switch (c) {
                case '\\': sb.append("\\\\"); break;
                case '"': sb.append("\\\""); break;
                case '/': sb.append("\\/"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c <= 0x1F || c >= 0x7F) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
            }
        }
        return sb.toString();
    }
}
