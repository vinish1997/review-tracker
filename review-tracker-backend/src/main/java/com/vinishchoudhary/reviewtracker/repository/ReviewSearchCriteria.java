package com.vinishchoudhary.reviewtracker.repository;

public class ReviewSearchCriteria {
    private String platformId;
    private String status;
    // Allow filtering by multiple statuses (OR)
    private java.util.List<String> statusIn;
    // Multi-selects
    private java.util.List<String> platformIdIn;
    private String mediatorId;
    private java.util.List<String> mediatorIdIn;
    private String productNameContains;
    private String orderIdContains;
    private String dealType;
    private java.util.List<String> dealTypeIn;
    private Boolean hasRefundFormUrl;

    public ReviewSearchCriteria() {
    }

    public ReviewSearchCriteria(String platformId, String status, java.util.List<String> statusIn,
            java.util.List<String> platformIdIn, String mediatorId, java.util.List<String> mediatorIdIn,
            String productNameContains, String orderIdContains, String dealType, java.util.List<String> dealTypeIn,
            Boolean hasRefundFormUrl) {
        this.platformId = platformId;
        this.status = status;
        this.statusIn = statusIn;
        this.platformIdIn = platformIdIn;
        this.mediatorId = mediatorId;
        this.mediatorIdIn = mediatorIdIn;
        this.productNameContains = productNameContains;
        this.orderIdContains = orderIdContains;
        this.dealType = dealType;
        this.dealTypeIn = dealTypeIn;
        this.hasRefundFormUrl = hasRefundFormUrl;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getPlatformId() {
        return platformId;
    }

    public void setPlatformId(String platformId) {
        this.platformId = platformId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMediatorId() {
        return mediatorId;
    }

    public void setMediatorId(String mediatorId) {
        this.mediatorId = mediatorId;
    }

    public java.util.List<String> getMediatorIdIn() {
        return mediatorIdIn;
    }

    public void setMediatorIdIn(java.util.List<String> mediatorIdIn) {
        this.mediatorIdIn = mediatorIdIn;
    }

    public java.util.List<String> getStatusIn() {
        return statusIn;
    }

    public void setStatusIn(java.util.List<String> statusIn) {
        this.statusIn = statusIn;
    }

    public java.util.List<String> getPlatformIdIn() {
        return platformIdIn;
    }

    public void setPlatformIdIn(java.util.List<String> platformIdIn) {
        this.platformIdIn = platformIdIn;
    }

    public java.util.List<String> getDealTypeIn() {
        return dealTypeIn;
    }

    public void setDealTypeIn(java.util.List<String> dealTypeIn) {
        this.dealTypeIn = dealTypeIn;
    }

    public String getProductNameContains() {
        return productNameContains;
    }

    public void setProductNameContains(String productNameContains) {
        this.productNameContains = productNameContains;
    }

    public String getOrderIdContains() {
        return orderIdContains;
    }

    public void setOrderIdContains(String orderIdContains) {
        this.orderIdContains = orderIdContains;
    }

    public String getDealType() {
        return dealType;
    }

    public void setDealType(String dealType) {
        this.dealType = dealType;
    }

    public Boolean getHasRefundFormUrl() {
        return hasRefundFormUrl;
    }

    public void setHasRefundFormUrl(Boolean hasRefundFormUrl) {
        this.hasRefundFormUrl = hasRefundFormUrl;
    }

    public static final class Builder {
        private String platformId;
        private String status;
        private java.util.List<String> statusIn;
        private java.util.List<String> platformIdIn;
        private String mediatorId;
        private java.util.List<String> mediatorIdIn;
        private String productNameContains;
        private String orderIdContains;
        private String dealType;
        private java.util.List<String> dealTypeIn;
        private Boolean hasRefundFormUrl;

        private Builder() {
        }

        public Builder platformId(String platformId) {
            this.platformId = platformId;
            return this;
        }

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public Builder statusIn(java.util.List<String> statusIn) {
            this.statusIn = statusIn;
            return this;
        }

        public Builder platformIdIn(java.util.List<String> platformIdIn) {
            this.platformIdIn = platformIdIn;
            return this;
        }

        public Builder mediatorId(String mediatorId) {
            this.mediatorId = mediatorId;
            return this;
        }

        public Builder mediatorIdIn(java.util.List<String> mediatorIdIn) {
            this.mediatorIdIn = mediatorIdIn;
            return this;
        }

        public Builder productNameContains(String productNameContains) {
            this.productNameContains = productNameContains;
            return this;
        }

        public Builder orderIdContains(String orderIdContains) {
            this.orderIdContains = orderIdContains;
            return this;
        }

        public Builder dealType(String dealType) {
            this.dealType = dealType;
            return this;
        }

        public Builder dealTypeIn(java.util.List<String> dealTypeIn) {
            this.dealTypeIn = dealTypeIn;
            return this;
        }

        public Builder hasRefundFormUrl(Boolean hasRefundFormUrl) {
            this.hasRefundFormUrl = hasRefundFormUrl;
            return this;
        }

        public ReviewSearchCriteria build() {
            return new ReviewSearchCriteria(platformId, status, statusIn, platformIdIn, mediatorId, mediatorIdIn,
                    productNameContains, orderIdContains, dealType, dealTypeIn, hasRefundFormUrl);
        }
    }
}
