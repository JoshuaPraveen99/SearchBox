package com.search;

import java.io.Serializable;
import java.util.*;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;
import javax.faces.context.ExternalContext;
import javax.faces.context.FacesContext;

public class SelfServiceSettingsBBean implements Serializable {

    private static final long serialVersionUID = 1L;

    /* ===== Event + Pickup dropdown lists ===== */
    private List<String> eventCodesList;
    private List<String> pickupTypeList;

    private Map<String, Boolean> selectedEventCodesMap;
    private Map<String, Boolean> selectedPickupTypeMap;

    /* ===== Hidden fields for submit ===== */
    private String selectedEventCodesString;
    private String selectedPickupTypesString;

    /* ===== Notification messages (chips + suggestions) ===== */
    private List<String> searchNotificationMessages;
    private Map<String, Boolean> selectedNotificationMap;

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

    /* (Not used in transport; we use requestMap) */
    private String notificationSuggestionsJson;
    public String getNotificationSuggestionsJson() { return notificationSuggestionsJson; }

    @PostConstruct
    public void init() {
        eventCodesList = Arrays.asList(
                // Original 30
                "EVT001 - Registration","EVT002 - Payment","EVT003 - Cancellation","EVT004 - Activation",
                "EVT005 - Suspension","EVT006 - Reactivation","EVT007 - Modification","EVT008 - Upgrade",
                "EVT009 - Downgrade","EVT010 - Transfer","EVT011 - Renewal","EVT012 - Expiration",
                "EVT013 - Notification","EVT014 - Alert","EVT015 - Warning","EVT016 - Error",
                "EVT017 - Success","EVT018 - Pending","EVT019 - Approved","EVT020 - Rejected",
                "EVT021 - Processing","EVT022 - Completed","EVT023 - Failed","EVT024 - Timeout",
                "EVT025 - Retry","EVT026 - Confirmation","EVT027 - Verification","EVT028 - Authentication",
                "EVT029 - Authorization","EVT030 - Logout",
                
                // ✅ NEW: 30 additional event codes (total 60)
                "EVT031 - Session Start","EVT032 - Session End","EVT033 - Data Export","EVT034 - Data Import",
                "EVT035 - File Upload","EVT036 - File Download","EVT037 - Profile Update","EVT038 - Password Reset",
                "EVT039 - Email Verification","EVT040 - Phone Verification","EVT041 - Two-Factor Auth","EVT042 - Account Lock",
                "EVT043 - Account Unlock","EVT044 - Privacy Settings","EVT045 - Notification Settings","EVT046 - Language Change",
                "EVT047 - Theme Change","EVT048 - Export Report","EVT049 - Generate Invoice","EVT050 - Process Refund",
                "EVT051 - Issue Credit","EVT052 - Apply Discount","EVT053 - Remove Discount","EVT054 - Tax Calculation",
                "EVT055 - Shipping Label","EVT056 - Tracking Update","EVT057 - Delivery Confirmed","EVT058 - Return Initiated",
                "EVT059 - Warranty Claim","EVT060 - Support Ticket"
            );

            // ✅ 55 Pickup Types (exceeds 35 limit for testing)
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
                
                // ✅ NEW: 25 additional pickup types (total 55)
                "Contactless Delivery","White Glove Service","Inside Delivery","Room of Choice",
                "Assembly Required","Installation Included","Freight Shipping","LTL Shipping",
                "FTL Shipping","Cold Chain Delivery","Temperature Controlled","Refrigerated Transport",
                "Hazmat Shipping","Oversized Item Delivery","Heavy Item Delivery","Signature Required",
                "Adult Signature Required","No Signature Required","Leave at Door","Doorstep Delivery",
                "Concierge Delivery","Scheduled Time Slot","2-Hour Window","4-Hour Window","All Day Window"
            );

            // ✅ 65 Notification Messages (exceeds 50 limit for testing)
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
                "Senior citizen");

        selectedEventCodesMap = new LinkedHashMap<>();
        eventCodesList.forEach(code -> selectedEventCodesMap.put(code, false));

        selectedPickupTypeMap = new LinkedHashMap<>();
        pickupTypeList.forEach(type -> selectedPickupTypeMap.put(type, false));

        selectedNotificationMap = new LinkedHashMap<>();
        searchNotificationMessages.forEach(m -> selectedNotificationMap.put(m, false));

        eventCodeTooltips = new LinkedHashMap<>();
        eventCodeTooltips.put("EVT001 - Registration", "Employee Created");
        eventCodeTooltips.put("EVT002 - Payment", "Employee Updated");
        eventCodeTooltips.put("EVT003 - Cancellation", "Employee Deleted");

        chipQuery = "";
        selectedEventCodesString = "";
        selectedPickupTypesString = "";
        notificationSuggestionsJson = "[]";
    }

    /* ====== Getters for UI lists ====== */
    public List<String> getEventCodesList() { return eventCodesList; }
    public List<String> getPickupTypeList() { return pickupTypeList; }
    public Map<String, Boolean> getSelectedEventCodesMap() { return selectedEventCodesMap; }
    public Map<String, Boolean> getSelectedPickupTypeMap() { return selectedPickupTypeMap; }
    public Map<String, Boolean> getSelectedNotificationMap() { return selectedNotificationMap; }

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

    /* Drives chip rendering */
    public List<String> getSelectedNotificationList() {
        return selectedNotificationMap.entrySet().stream()
                .filter(Map.Entry::getValue)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    /* Toggle from client (chips) */
    private String toggleLabel;
    private boolean toggleChecked;
    public String getToggleLabel() { return toggleLabel; }
    public void setToggleLabel(String toggleLabel) { this.toggleLabel = toggleLabel; }
    public boolean isToggleChecked() { return toggleChecked; }
    public void setToggleChecked(boolean toggleChecked) { this.toggleChecked = toggleChecked; }

    public String toggleNotification() {
        if (toggleLabel != null) {
            selectedNotificationMap.put(toggleLabel, toggleChecked);
        }
        return null;
    }

    /* Summary */
    public String printSelections() {
        String events = selectedEventCodesMap.entrySet().stream()
                .filter(Map.Entry::getValue).map(Map.Entry::getKey)
                .collect(Collectors.joining(", "));

        String pickups = selectedPickupTypeMap.entrySet().stream()
                .filter(Map.Entry::getValue).map(Map.Entry::getKey)
                .collect(Collectors.joining(", "));

        String notifs = selectedNotificationMap.entrySet().stream()
                .filter(Map.Entry::getValue).map(Map.Entry::getKey)
                .collect(Collectors.joining(", "));

        selectedSummary =
                "<b>Event Codes:</b> " + (events.isEmpty() ? "None" : events) + "<br/>" +
                "<b>Pickup Types:</b> " + (pickups.isEmpty() ? "None" : pickups) + "<br/>" +
                "<b>Notifications:</b> " + (notifs.isEmpty() ? "None" : notifs);

        return null;
    }

    /**
     * RichFaces AJAX: filter suggestions; return JSON via requestMap
     */
    public void fetchNotificationSuggestions() {
        ExternalContext ext = FacesContext.getCurrentInstance().getExternalContext();
        try {
            String q = chipQuery == null ? "" : chipQuery.trim().toLowerCase();

            List<String> filtered = q.isEmpty()
                    ? new ArrayList<>(searchNotificationMessages)
                    : searchNotificationMessages.stream()
                        .filter(m -> m.toLowerCase().contains(q))
                        .collect(Collectors.toList());

            StringBuilder json = new StringBuilder(filtered.size() * 32);
            json.append('[');
            for (int i = 0; i < filtered.size(); i++) {
                if (i > 0) json.append(',');
                json.append('"').append(escapeJson(filtered.get(i))).append('"');
            }
            json.append(']');

            ext.getRequestMap().put("notifJson", json.toString());
        } catch (Exception e) {
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
