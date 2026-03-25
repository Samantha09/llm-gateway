package com.qizlan.llm.gateway.persistence.repository;

import com.qizlan.llm.gateway.persistence.entity.ProviderKeyEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProviderKeyRepository extends JpaRepository<ProviderKeyEntity, String> {

    List<ProviderKeyEntity> findByOrganizationId(String organizationId);

    List<ProviderKeyEntity> findByProviderId(String providerId);

    List<ProviderKeyEntity> findByActiveTrue();
}
