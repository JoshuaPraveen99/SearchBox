package com.search;

import java.io.Serializable;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;
import javax.faces.component.UIComponent;
import javax.faces.component.UISelectBoolean;

import org.ajax4jsf.event.AjaxEvent;

public class SelfServiceSettingsBBean implements Serializable {

    private List<String> eventCodesList;
    private List<String> pickupTypeList;
    private List<String> searchNotificationMessages;

    private Map<String, Boolean> selectedEventCodesMap;
    private Map<String, Boolean> selectedPickupTypeMap;

    private String selectedNotificationTexts;
    private String selectedSummary;
    
    private Map<String, Boolean> selectedNotificationMap;
    
    public Map<String, String> eventCodeTooltips ;

    	// Getter
    	public Map<String, String> getEventCodeTooltips() {
    	    return eventCodeTooltips;
    	}

    @PostConstruct
    public void init() {
        eventCodesList = Arrays.asList("EVT001 - Registration", "EVT002 - Payment", "EVT003 - Cancellation");
        pickupTypeList = Arrays.asList("Home Delivery", "Store Pickup", "Mail Order");
        searchNotificationMessages = Arrays.asList(
                "Prescription ready for pickup",
                "Medicine out of stock",
                "Refill reminder",
                "Order shipped",
                "Discount available"
        );

        selectedEventCodesMap = new LinkedHashMap<>();
        eventCodesList.forEach(e -> selectedEventCodesMap.put(e, false));

        selectedPickupTypeMap = new LinkedHashMap<>();
        pickupTypeList.forEach(t -> selectedPickupTypeMap.put(t, false));
        
        selectedNotificationMap = new LinkedHashMap<>();
        searchNotificationMessages.forEach(m -> selectedNotificationMap.put(m, false));
        
        eventCodeTooltips = new LinkedHashMap<>();
        eventCodeTooltips.put("EVT001", "Employee Created");
        eventCodeTooltips.put("EVT002", "Employee Updated");
        eventCodeTooltips.put("EVT003", "Employee Deleted");
    }

    // Getters
    public List<String> getEventCodesList() { return eventCodesList; }
    public List<String> getPickupTypeList() { return pickupTypeList; }

    public String getSelectedNotificationTexts() { return selectedNotificationTexts; }
    public void setSelectedNotificationTexts(String s) { this.selectedNotificationTexts = s; }

    public Map<String, Boolean> getSelectedEventCodesMap() { return selectedEventCodesMap; }
    public Map<String, Boolean> getSelectedPickupTypeMap() { return selectedPickupTypeMap; }

    public List<String> filterNotificationMessages(Object query) {
        if (query == null) return searchNotificationMessages;

        String text = query.toString();
        String[] tokens = text.split(",");
        String lastToken = tokens[tokens.length - 1].trim().toLowerCase();

        if (lastToken.isEmpty()) {
            return searchNotificationMessages;
        }

        return searchNotificationMessages.stream()
                .filter(m -> m.toLowerCase().contains(lastToken))
                .collect(Collectors.toList());
    }


    // Checkbox handler for dropdowns
    public void updateSelection(AjaxEvent event) {
        UIComponent comp = event.getComponent();
        UIComponent c = comp;
        while (c != null && !(c instanceof javax.faces.component.UISelectBoolean)) {
            c = c.getParent();
        }
        if (!(c instanceof javax.faces.component.UISelectBoolean)) return;

        String type = (String) comp.getAttributes().get("type");
        String label = (String) comp.getAttributes().get("label");

        boolean selected = ((UISelectBoolean) comp).isSelected();

        switch (type) {
            case "event":
                selectedEventCodesMap.put(label, selected);
                break;
            case "pickup":
                selectedPickupTypeMap.put(label, selected);
                break;
                
            case "notification":
                selectedNotificationMap.put(label, selected);
                // rebuild the display text for textarea
                selectedNotificationTexts = selectedNotificationMap.entrySet().stream()
                        .filter(Map.Entry::getValue)
                        .map(Map.Entry::getKey)
                        .collect(Collectors.joining(", "));
                break;

            default:
                break;
        }
    }

    
    public List<String> getSearchNotificationMessages() {
		return searchNotificationMessages;
	}

	public void setSearchNotificationMessages(List<String> searchNotificationMessages) {
		this.searchNotificationMessages = searchNotificationMessages;
	}

	public Map<String, Boolean> getSelectedNotificationMap() {
		return selectedNotificationMap;
	}

	public void setSelectedNotificationMap(Map<String, Boolean> selectedNotificationMap) {
		this.selectedNotificationMap = selectedNotificationMap;
	}

	public void setEventCodesList(List<String> eventCodesList) {
		this.eventCodesList = eventCodesList;
	}

	public void setPickupTypeList(List<String> pickupTypeList) {
		this.pickupTypeList = pickupTypeList;
	}

	public void setSelectedEventCodesMap(Map<String, Boolean> selectedEventCodesMap) {
		this.selectedEventCodesMap = selectedEventCodesMap;
	}

	public void setSelectedPickupTypeMap(Map<String, Boolean> selectedPickupTypeMap) {
		this.selectedPickupTypeMap = selectedPickupTypeMap;
	}

	public void setSelectedSummary(String selectedSummary) {
		this.selectedSummary = selectedSummary;
	}

	public void setEventCodeTooltips(Map<String, String> eventCodeTooltips) {
		this.eventCodeTooltips = eventCodeTooltips;
	}

	public String printSelections() {
        String events = selectedEventCodesMap.entrySet().stream()
                .filter(Map.Entry::getValue)
                .map(Map.Entry::getKey)
                .collect(Collectors.joining(", "));
        String pickups = selectedPickupTypeMap.entrySet().stream()
                .filter(Map.Entry::getValue)
                .map(Map.Entry::getKey)
                .collect(Collectors.joining(", "));
        
        String notifications = selectedNotificationMap.entrySet().stream()
                .filter(Map.Entry::getValue)
                .map(Map.Entry::getKey)
                .collect(Collectors.joining(", "));


        selectedSummary = "<b>Event Codes:</b> " + events + "<br/>" +
                          "<b>Pickup Types:</b> " + pickups + "<br/>" +
                          "<b>Notifications:</b> " + notifications;
        return null;
    }
	
	public void printDebug(AjaxEvent event) {
	    UIComponent src = event.getComponent();
	    System.out.println("#### AJAX FIRED");

	    System.out.println("> SRC CLASS: " + src.getClass().getName());
	    System.out.println("> ATTR TYPE: " + src.getAttributes().get("type"));
	    System.out.println("> ATTR LABEL: " + src.getAttributes().get("label"));

	    // ✅ climb to checkbox
	    UIComponent c = src;
	    while (c != null && !(c instanceof UISelectBoolean)) c = c.getParent();

	    if(c instanceof UISelectBoolean) {
	        boolean val = ((UISelectBoolean)c).isSelected();
	        System.out.println("> CHECKBOX VALUE: " + val);
	    } else {
	        System.out.println("> CHECKBOX NOT FOUND!");
	    }
	}

    public String getSelectedSummary() { return selectedSummary; }

}