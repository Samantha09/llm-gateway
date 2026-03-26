package com.qizlan.llm.gateway.config;

import com.qizlan.llm.gateway.gateway.service.UserService;
import com.qizlan.llm.gateway.persistence.entity.ModelEntity;
import com.qizlan.llm.gateway.persistence.entity.ModelProviderMappingEntity;
import com.qizlan.llm.gateway.persistence.entity.ProviderEntity;
import com.qizlan.llm.gateway.persistence.repository.ModelProviderMappingRepository;
import com.qizlan.llm.gateway.persistence.repository.ModelRepository;
import com.qizlan.llm.gateway.persistence.repository.ProviderRepository;
import com.qizlan.llm.gateway.persistence.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ControlPlaneSeedDataConfig {

    private static final Logger log = LoggerFactory.getLogger(ControlPlaneSeedDataConfig.class);

    @Bean
    CommandLineRunner seedControlPlaneData(
            ProviderRepository providerRepository,
            ModelRepository modelRepository,
            ModelProviderMappingRepository mappingRepository,
            UserRepository userRepository,
            UserService userService,
            AuthProperties authProperties
    ) {
        return args -> {
            log.info("Seeding control-plane data...");

            // Create seed admin user
            if (userRepository.findByEmail(authProperties.getSeedUserEmail()).isEmpty()) {
                userService.create(
                    authProperties.getSeedUserEmail(),
                    authProperties.getSeedUserName(),
                    authProperties.getSeedUserPassword()
                );
                log.info("Created seed admin user: {}", authProperties.getSeedUserEmail());
            }

            // Create providers
            ProviderEntity openai = providerRepository.findById("openai")
                    .orElseGet(() -> providerRepository.save(new ProviderEntity("openai", "OpenAI", true, true)));
            ProviderEntity anthropic = providerRepository.findById("anthropic")
                    .orElseGet(() -> providerRepository.save(new ProviderEntity("anthropic", "Anthropic", true, false)));
            ProviderEntity google = providerRepository.findById("google")
                    .orElseGet(() -> providerRepository.save(new ProviderEntity("google", "Google", true, true)));
            ProviderEntity kimi = providerRepository.findById("kimi")
                    .orElseGet(() -> providerRepository.save(new ProviderEntity("kimi", "Kimi", true, false)));
            ProviderEntity kimiCodeplan = providerRepository.findById("kimi-codeplan")
                    .orElseGet(() -> providerRepository.save(new ProviderEntity("kimi-codeplan", "Kimi CodePlan", true, false)));

            // Create models
            ModelEntity gpt4o = modelRepository.findById("gpt-4o")
                    .orElseGet(() -> modelRepository.save(ModelEntity.textModel("gpt-4o", "GPT-4o", "openai", false, true, true, true, true, true)));
            ModelEntity claude = modelRepository.findById("claude-3-5-sonnet")
                    .orElseGet(() -> modelRepository.save(ModelEntity.textModel("claude-3-5-sonnet", "Claude 3.5 Sonnet", "anthropic", false, true, true, true, false, true)));
            ModelEntity geminiText = modelRepository.findById("gemini-2.0-flash")
                    .orElseGet(() -> modelRepository.save(ModelEntity.textModel("gemini-2.0-flash", "Gemini 2.0 Flash", "google", false, false, false, true, false, true)));
            ModelEntity geminiImage = modelRepository.findById("gemini-2.5-flash-image")
                    .orElseGet(() -> modelRepository.save(ModelEntity.imageModel("gemini-2.5-flash-image", "Gemini 2.5 Flash Image", "google", true)));
            ModelEntity kimiModel = modelRepository.findById("kimi-k2")
                    .orElseGet(() -> modelRepository.save(ModelEntity.textModel("kimi-k2", "Kimi K2", "kimi", false, true, true, true, false, true)));
            ModelEntity kimiCodeplanModel = modelRepository.findById("kimi-code")
                    .orElseGet(() -> modelRepository.save(ModelEntity.textModel("kimi-code", "Kimi Code", "kimi-codeplan", false, true, true, true, false, true)));

            // Create mappings
            if (!mappingRepository.existsByModelIdAndProviderId("gpt-4o", "openai")) {
                mappingRepository.save(ModelProviderMappingEntity.of(gpt4o, openai, "gpt-4o", true, false, true, true, true, 10));
            }
            if (!mappingRepository.existsByModelIdAndProviderId("claude-3-5-sonnet", "anthropic")) {
                mappingRepository.save(ModelProviderMappingEntity.of(claude, anthropic, "claude-3-5-sonnet", true, false, true, true, false, 10));
            }
            if (!mappingRepository.existsByModelIdAndProviderId("gemini-2.0-flash", "google")) {
                mappingRepository.save(ModelProviderMappingEntity.of(geminiText, google, "gemini-2.0-flash", true, false, false, false, false, 10));
            }
            if (!mappingRepository.existsByModelIdAndProviderId("gemini-2.5-flash-image", "google")) {
                mappingRepository.save(ModelProviderMappingEntity.of(geminiImage, google, "gemini-2.5-flash-image", true, true, false, false, false, 10));
            }
            if (!mappingRepository.existsByModelIdAndProviderId("kimi-k2", "kimi")) {
                mappingRepository.save(ModelProviderMappingEntity.of(kimiModel, kimi, "kimi-k2", true, false, true, true, false, 10));
            }
            if (!mappingRepository.existsByModelIdAndProviderId("kimi-code", "kimi-codeplan")) {
                mappingRepository.save(ModelProviderMappingEntity.of(kimiCodeplanModel, kimiCodeplan, "kimi-code", true, false, true, true, false, 10));
            }

            // Gateway-text model mapped to all providers
            ModelEntity gatewayText = modelRepository.findById("gateway-text")
                    .orElseGet(() -> modelRepository.save(ModelEntity.textModel("gateway-text", "Gateway Text", "gateway", false, true, true, true, false, true)));
            if (!mappingRepository.existsByModelIdAndProviderId("gateway-text", "openai")) {
                mappingRepository.save(ModelProviderMappingEntity.of(gatewayText, openai, "gpt-4o", true, false, true, true, false, 10));
            }
            if (!mappingRepository.existsByModelIdAndProviderId("gateway-text", "anthropic")) {
                mappingRepository.save(ModelProviderMappingEntity.of(gatewayText, anthropic, "claude-3-5-sonnet", true, false, true, true, false, 20));
            }
            if (!mappingRepository.existsByModelIdAndProviderId("gateway-text", "google")) {
                mappingRepository.save(ModelProviderMappingEntity.of(gatewayText, google, "gemini-2.0-flash", true, false, false, false, false, 30));
            }
            if (!mappingRepository.existsByModelIdAndProviderId("gateway-text", "kimi")) {
                mappingRepository.save(ModelProviderMappingEntity.of(gatewayText, kimi, "kimi-k2", true, false, true, true, false, 40));
            }
            if (!mappingRepository.existsByModelIdAndProviderId("gateway-text", "kimi-codeplan")) {
                mappingRepository.save(ModelProviderMappingEntity.of(gatewayText, kimiCodeplan, "kimi-code", true, false, true, true, false, 50));
            }

            log.info("Control-plane seed data complete");
        };
    }
}
