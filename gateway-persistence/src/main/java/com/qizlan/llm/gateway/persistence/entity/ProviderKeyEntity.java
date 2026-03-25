package com.qizlan.llm.gateway.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "provider_key")
public class ProviderKeyEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, name = "provider_id")
    private String providerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_ref_id")
    private ProviderEntity provider;

    @Column(nullable = false, name = "api_key_value")
    private String apiKeyValue;

    @Column(nullable = false)
    private boolean active;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private OrganizationEntity organization;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    protected ProviderKeyEntity() {
    }

    public ProviderKeyEntity(String name, String providerId, String apiKeyValue, boolean active, OrganizationEntity organization) {
        this.name = name;
        this.providerId = providerId;
        this.apiKeyValue = apiKeyValue;
        this.active = active;
        this.organization = organization;
    }

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID().toString().replace("-", "");
        }
        OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getProviderId() {
        return providerId;
    }

    public ProviderEntity getProvider() {
        return provider;
    }

    public String getApiKeyValue() {
        return apiKeyValue;
    }

    public boolean isActive() {
        return active;
    }

    public OrganizationEntity getOrganization() {
        return organization;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setProviderId(String providerId) {
        this.providerId = providerId;
    }

    public void setProvider(ProviderEntity provider) {
        this.provider = provider;
    }

    public void setApiKeyValue(String apiKeyValue) {
        this.apiKeyValue = apiKeyValue;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public void setOrganization(OrganizationEntity organization) {
        this.organization = organization;
    }
}
