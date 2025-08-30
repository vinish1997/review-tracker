package com.vinishchoudhary.reviewtracker.repository;

public class ReviewSearchCriteria {
    private String platformId;
    private String statusId;
    private String mediatorId;
    private String productNameContains;
    private String orderIdContains;

    public ReviewSearchCriteria() {
    }

    public ReviewSearchCriteria(String platformId, String statusId, String mediatorId, String productNameContains, String orderIdContains) {
        this.platformId = platformId;
        this.statusId = statusId;
        this.mediatorId = mediatorId;
        this.productNameContains = productNameContains;
        this.orderIdContains = orderIdContains;
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

    public String getStatusId() {
        return statusId;
    }

    public void setStatusId(String statusId) {
        this.statusId = statusId;
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

    public static final class Builder {
        private String platformId;
        private String statusId;
        private String mediatorId;
        private String productNameContains;
        private String orderIdContains;

        private Builder() { }

        public Builder platformId(String platformId) {
            this.platformId = platformId;
            return this;
        }

        public Builder statusId(String statusId) {
            this.statusId = statusId;
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

        public ReviewSearchCriteria build() {
            return new ReviewSearchCriteria(platformId, statusId, mediatorId, productNameContains, orderIdContains);
        }
    }
}
