package com.qizlan.llm.gateway.config;

import com.qizlan.llm.gateway.gateway.service.ModelCatalogService;
import com.qizlan.llm.gateway.gateway.service.RoutingProjectionInvalidationService;
import com.qizlan.llm.gateway.gateway.service.RoutingProjectionStateService;
import com.qizlan.llm.gateway.gateway.service.ModelRoutingCache;
import com.qizlan.llm.gateway.persistence.repository.ModelProviderMappingRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Minimal routing configuration for control-plane.
 * Provides ModelCatalogService without full caching infrastructure.
 */
@Configuration
public class ControlPlaneRoutingConfig {

    @Bean
    public RoutingProjectionStateService routingProjectionStateService() {
        // Return a minimal implementation that always returns version 0
        return new RoutingProjectionStateService(null) {
            @Override
            public ProjectionVersion currentVersion() {
                return new ProjectionVersion(0L, 0L);
            }

            @Override
            public ProjectionVersion markRoutingMetadataChanged(String reason) {
                return new ProjectionVersion(0L, 0L);
            }
        };
    }

    @Bean
    public ModelRoutingCache modelRoutingCache() {
        return new ModelRoutingCache();
    }

    @Bean
    public RoutingProjectionInvalidationService routingProjectionInvalidationService(
            RoutingProjectionStateService routingProjectionStateService,
            ModelRoutingCache modelRoutingCache) {
        return new RoutingProjectionInvalidationService(
                routingProjectionStateService,
                modelRoutingCache,
                0L
        ) {
            @Override
            public void refreshIfNeeded() {
                // No-op: control-plane doesn't cache model mappings
            }
        };
    }

    @Bean
    public ModelCatalogService modelCatalogService(
            ModelProviderMappingRepository mappingRepository,
            RoutingProjectionInvalidationService routingProjectionInvalidationService) {
        return new ModelCatalogService(mappingRepository, routingProjectionInvalidationService);
    }
}
