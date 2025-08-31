package com.vinishchoudhary.reviewtracker.repository;

public class ReviewSearchCriteria {
    private String platformId;
    private String status;
    private String mediatorId;
    private String productNameContains;
    private String orderIdContains;
    private String dealType;

    public ReviewSearchCriteria() {
    }

    public ReviewSearchCriteria(String platformId, String status, String mediatorId, String productNameContains, String orderIdContains, String dealType) {
        this.platformId = platformId;
        this.status = status;
        this.mediatorId = mediatorId;
        this.productNameContains = productNameContains;
        this.orderIdContains = orderIdContains;
        this.dealType = dealType;
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

    public String getDealType() { return dealType; }
    public void setDealType(String dealType) { this.dealType = dealType; }

    public static final class Builder {
        private String platformId;
        private String status;
        private String mediatorId;
        private String productNameContains;
        private String orderIdContains;
        private String dealType;

        private Builder() { }

        public Builder platformId(String platformId) {
            this.platformId = platformId;
            return this;
        }

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public Builder mediatorId(String mediatorId) {
            this.mediatorId = mediatorId;
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

        public ReviewSearchCriteria build() {
            return new ReviewSearchCriteria(platformId, status, mediatorId, productNameContains, orderIdContains, dealType);
        }
    }
}
