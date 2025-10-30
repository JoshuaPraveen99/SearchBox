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

    /* ===== NEW: Hidden strings for form submission ===== */
    private String selectedEventCodesString;
    private String selectedPickupTypesString;

    /* ===== Notification messages (chips + suggestions) ===== */
    private List<String> searchNotificationMessages;
    private Map<String, Boolean> selectedNotificationMap;

    /* ⚠️ chipQuery = text user is currently typing in chip editor */
    private String chipQuery;
    public String getChipQuery() { return chipQuery; }
    public void setChipQuery(String chipQuery) { this.chipQuery = chipQuery; }

    /* ===== NEW: Property to hold filtered JSON for Ajax response ===== */
    private String notificationSuggestionsJson;
    
    public String getNotificationSuggestionsJson() {
        return notificationSuggestionsJson;
    }

    /* Summary shown after submit */
    private String selectedSummary;
    public String getSelectedSummary() { return selectedSummary; }

    /* Tooltip map for Event Codes */
    private Map<String, String> eventCodeTooltips;
    public Map<String, String> getEventCodeTooltips() { return eventCodeTooltips; }


    @PostConstruct
    public void init() {

        /* === Dummy data for your UI === */
        eventCodesList = new ArrayList<>(Arrays.asList(
                "EVT001 - Registration",
                "EVT002 - Payment",
                "EVT003 - Cancellation",
                "EVT004 - Activation",
                "EVT005 - Suspension",
                "EVT006 - Reactivation",
                "EVT007 - Modification",
                "EVT008 - Upgrade",
                "EVT009 - Downgrade",
                "EVT010 - Transfer",
                "EVT011 - Renewal",
                "EVT012 - Expiration",
                "EVT013 - Notification",
                "EVT014 - Alert",
                "EVT015 - Warning",
                "EVT016 - Error",
                "EVT017 - Success",
                "EVT018 - Pending",
                "EVT019 - Approved",
                "EVT020 - Rejected",
                "EVT021 - Processing",
                "EVT022 - Completed",
                "EVT023 - Failed",
                "EVT024 - Timeout",
                "EVT025 - Retry",
                "EVT026 - Confirmation",
                "EVT027 - Verification",
                "EVT028 - Authentication",
                "EVT029 - Authorization",
                "EVT030 - Logout"
            ));
            
            // 30 Pickup Types
            pickupTypeList = new ArrayList<>(Arrays.asList(
                "Home Delivery",
                "Store Pickup",
                "Mail Order",
                "Express Delivery",
                "Same Day Delivery",
                "Next Day Delivery",
                "Standard Shipping",
                "Priority Shipping",
                "Overnight Shipping",
                "International Shipping",
                "Curbside Pickup",
                "Drive-Through Pickup",
                "Locker Pickup",
                "Counter Pickup",
                "Pharmacy Pickup",
                "In-Store Collection",
                "Click and Collect",
                "Ship to Store",
                "Local Delivery",
                "Regional Delivery",
                "National Delivery",
                "Courier Service",
                "Postal Service",
                "Parcel Locker",
                "Drop Box",
                "Mobile Delivery",
                "Scheduled Delivery",
                "Weekend Delivery",
                "Evening Delivery",
                "Morning Delivery"
            ));
            
            // 30 Notification Messages
            searchNotificationMessages = new ArrayList<>(Arrays.asList(
                "Prescription ready for pickup",
                "Medicine out of stock",
                "Refill reminder",
                "Order shipped",
                "Discount available",
                "New prescription received",
                "Insurance claim approved",
                "Payment pending",
                "Delivery scheduled",
                "Package delayed",
                "Appointment reminder",
                "Lab results ready",
                "Vaccination due",
                "Medication interaction alert",
                "Dosage change notification",
                "Generic alternative available",
                "Prior authorization required",
                "Copay amount changed",
                "Pharmacy location changed",
                "Transfer request received",
                "Prescription expired",
                "Doctor consultation required",
                "Side effects reported",
                "Allergic reaction warning",
                "Temperature sensitive item",
                "Controlled substance notice",
                "Refill limit reached",
                "Insurance verification needed",
                "Signature required for delivery",
                "Special handling instructions"
            ));
            
        selectedEventCodesMap = new LinkedHashMap<>();
        eventCodesList.forEach(e -> selectedEventCodesMap.put(e, false));

        selectedPickupTypeMap = new LinkedHashMap<>();
        pickupTypeList.forEach(t -> selectedPickupTypeMap.put(t, false));

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


    /* ===== NEW: Getters/Setters for hidden form fields ===== */
    public String getSelectedEventCodesString() {
        return selectedEventCodesString;
    }

    public void setSelectedEventCodesString(String selectedEventCodesString) {
        this.selectedEventCodesString = selectedEventCodesString;
        
        // Parse and update the map
        selectedEventCodesMap.replaceAll((k, v) -> false);
        
        if (selectedEventCodesString != null && !selectedEventCodesString.trim().isEmpty()) {
            String[] codes = selectedEventCodesString.split(",");
            for (String code : codes) {
                String trimmed = code.trim();
                if (!trimmed.isEmpty() && selectedEventCodesMap.containsKey(trimmed)) {
                    selectedEventCodesMap.put(trimmed, true);
                }
            }
        }
    }

    public String getSelectedPickupTypesString() {
        return selectedPickupTypesString;
    }

    public void setSelectedPickupTypesString(String selectedPickupTypesString) {
        this.selectedPickupTypesString = selectedPickupTypesString;
        
        // Parse and update the map
        selectedPickupTypeMap.replaceAll((k, v) -> false);
        
        if (selectedPickupTypesString != null && !selectedPickupTypesString.trim().isEmpty()) {
            String[] types = selectedPickupTypesString.split(",");
            for (String type : types) {
                String trimmed = type.trim();
                if (!trimmed.isEmpty() && selectedPickupTypeMap.containsKey(trimmed)) {
                    selectedPickupTypeMap.put(trimmed, true);
                }
            }
        }
    }


    /* ✅ This list drives chip rendering */
    public List<String> getSelectedNotificationList() {
        return selectedNotificationMap.entrySet().stream()
                .filter(Map.Entry::getValue)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }


    /* ✅ Filtering suggestions – RichFaces passes only current token because tokens="," */
    public List<String> filterNotificationMessages(Object query) {
        String q = (query == null) ? "" : query.toString().trim().toLowerCase();
        if (q.isEmpty()) return searchNotificationMessages;

        return searchNotificationMessages.stream()
                .filter(m -> m.toLowerCase().contains(q))
                .collect(Collectors.toList());
    }


    /* ✅ Called by jsFunction rfToggleNotif() - KEPT for notifications only */
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


    /* ✅ Final summary - now reads from properly synced maps */
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
     * ✅ FIXED: Ajax method that returns data via bean property instead of writing directly to response
     * This prevents page navigation and allows proper Ajax callback handling
     */
    public void fetchNotificationSuggestions() {
        FacesContext ctx = FacesContext.getCurrentInstance();
        ExternalContext ext = ctx.getExternalContext();
        
        System.out.println("[INFO] ===== fetchNotificationSuggestions() START =====");

        try {
            // Read query parameter from Ajax request
            Map<String, String> params = ext.getRequestParameterMap();
            String q = Optional.ofNullable(params.get("query")).orElse("").trim().toLowerCase();
            System.out.println("[INFO] Query received: '" + q + "'");

            // Filter notification messages based on query
            List<String> filtered;
            if (q.isEmpty()) {
                filtered = new ArrayList<>(searchNotificationMessages);
                System.out.println("[INFO] Empty query — returning full list (" + filtered.size() + ")");
            } else {
                filtered = searchNotificationMessages.stream()
                        .filter(m -> m.toLowerCase().contains(q))
                        .collect(Collectors.toList());
                System.out.println("[INFO] Filtered list size: " + filtered.size());
            }

            // Build JSON string and store in bean property
            StringBuilder json = new StringBuilder("[");
            for (int i = 0; i < filtered.size(); i++) {
                if (i > 0) json.append(",");
                json.append("\"").append(escapeJson(filtered.get(i))).append("\"");
            }
            json.append("]");
            
            // Store in bean property - RichFaces will pass this to JavaScript callback
            notificationSuggestionsJson = json.toString();
            System.out.println("[INFO] JSON prepared: " + notificationSuggestionsJson.substring(0, Math.min(100, notificationSuggestionsJson.length())) + "...");

        } catch (Exception e) {
            System.err.println("[ERROR] Exception in fetchNotificationSuggestions: " + e.getMessage());
            e.printStackTrace(System.err);
            notificationSuggestionsJson = "[]"; // fallback
        }
        
        System.out.println("[INFO] ===== fetchNotificationSuggestions() END =====");
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\n", "\\n").replace("\r", "\\r");
    }
}
