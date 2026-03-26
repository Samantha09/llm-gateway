package com.qizlan.llm.gateway.gateway.service;

import com.qizlan.llm.gateway.config.GatewayProperties;
import com.qizlan.llm.gateway.persistence.entity.ProviderKeyEntity;
import com.qizlan.llm.gateway.persistence.repository.ProviderKeyRepository;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class ProviderKeyService {

    private static final Logger log = LoggerFactory.getLogger(ProviderKeyService.class);

    private final ProviderKeyRepository providerKeyRepository;
    private final GatewayProperties properties;

    public ProviderKeyService(ProviderKeyRepository providerKeyRepository, GatewayProperties properties) {
        this.providerKeyRepository = providerKeyRepository;
        this.properties = properties;
    }

    /**
     * 获取 provider 的 API key，优先从数据库读取，否则使用环境变量配置
     */
    public Optional<String> getApiKey(String providerId) {
        // 先从数据库查找活跃的密钥
        var keys = providerKeyRepository.findByProviderId(providerId);
        var dbKey = keys.stream()
                .filter(ProviderKeyEntity::isActive)
                .findFirst()
                .map(ProviderKeyEntity::getApiKeyValue);

        if (dbKey.isPresent()) {
            log.debug("Using database key for provider: {}", providerId);
            return dbKey;
        }

        // 否则使用环境变量配置的密钥
        log.debug("Using environment key for provider: {}", providerId);
        return getEnvApiKey(providerId);
    }

    /**
     * 检查 provider 是否已配置（数据库或环境变量）
     */
    public boolean isEnabled(String providerId) {
        // 检查数据库中是否有活跃密钥
        var keys = providerKeyRepository.findByProviderId(providerId);
        boolean hasDbKey = keys.stream().anyMatch(ProviderKeyEntity::isActive);
        if (hasDbKey) {
            return true;
        }

        // 否则检查环境变量配置
        return isEnvEnabled(providerId);
    }

    /**
     * 获取 provider 的 base URL
     */
    public String getBaseUrl(String providerId) {
        return switch (providerId) {
            case "openai" -> properties.providers().openai().baseUrl();
            case "anthropic" -> properties.providers().anthropic().baseUrl();
            case "google" -> properties.providers().google().baseUrl();
            case "kimi" -> properties.providers().kimi().baseUrl();
            case "kimi-codeplan" -> properties.providers().kimiCodeplan().baseUrl();
            default -> throw new IllegalArgumentException("Unknown provider: " + providerId);
        };
    }

    private Optional<String> getEnvApiKey(String providerId) {
        return switch (providerId) {
            case "openai" -> Optional.ofNullable(properties.providers().openai().apiKey());
            case "anthropic" -> Optional.ofNullable(properties.providers().anthropic().apiKey());
            case "google" -> Optional.ofNullable(properties.providers().google().apiKey());
            case "kimi" -> Optional.ofNullable(properties.providers().kimi().apiKey());
            case "kimi-codeplan" -> Optional.ofNullable(properties.providers().kimiCodeplan().apiKey());
            default -> Optional.empty();
        };
    }

    private boolean isEnvEnabled(String providerId) {
        return switch (providerId) {
            case "openai" -> properties.providers().openai().enabled();
            case "anthropic" -> properties.providers().anthropic().enabled();
            case "google" -> properties.providers().google().enabled();
            case "kimi" -> properties.providers().kimi().enabled();
            case "kimi-codeplan" -> properties.providers().kimiCodeplan().enabled();
            default -> false;
        };
    }
}
