package com.qizlan.llm.gateway.gateway.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.qizlan.llm.gateway.config.GatewayProperties;
import com.qizlan.llm.gateway.gateway.dto.ChatCompletionRequest;
import com.qizlan.llm.gateway.gateway.dto.ImageDtos;
import com.qizlan.llm.gateway.gateway.service.ProviderKeyService;
import io.micrometer.tracing.Tracer;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Component
public class KimiProviderAdapter extends AbstractHttpProviderAdapter {

    private final ProviderKeyService providerKeyService;

    public KimiProviderAdapter(GatewayProperties properties, ObjectMapper objectMapper, Tracer tracer,
                               ProviderKeyService providerKeyService) {
        super(properties.providers().kimi().baseUrl(), objectMapper, tracer);
        this.providerKeyService = providerKeyService;
    }

    private String getApiKey() {
        return providerKeyService.getApiKey("kimi")
                .orElseThrow(() -> new IllegalStateException("No API key configured for provider: kimi"));
    }

    @Override
    public String providerId() {
        return "kimi";
    }

    @Override
    public ProviderChatResult complete(ChatCompletionRequest request, String providerModel) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("model", providerModel);
            body.put("messages", toMessagePayload(request.messages()));
            body.put("stream", false);
            if (request.temperature() != null) {
                body.put("temperature", request.temperature());
            }
            if (request.max_tokens() != null) {
                body.put("max_tokens", request.max_tokens());
            }
            JsonNode root = postJson("/v1/chat/completions", Map.of("Authorization", "Bearer " + getApiKey()), body);
            String content = readText(root, "/choices/0/message/content");
            return new ProviderChatResult(
                    providerId(),
                    providerModel,
                    content,
                    false,
                    readInt(root, "/usage/prompt_tokens"),
                    readInt(root, "/usage/completion_tokens"),
                    readInt(root, "/usage/total_tokens")
            );
        } catch (WebClientResponseException ex) {
            throw mapException(providerId(), ex);
        }
    }

    @Override
    public Mono<ProviderChatResult> completeAsync(ChatCompletionRequest request, String providerModel) {
        Map<String, Object> body = new HashMap<>();
        body.put("model", providerModel);
        body.put("messages", toMessagePayload(request.messages()));
        body.put("stream", false);
        if (request.temperature() != null) {
            body.put("temperature", request.temperature());
        }
        if (request.max_tokens() != null) {
            body.put("max_tokens", request.max_tokens());
        }
        return postJsonAsync("/v1/chat/completions", Map.of("Authorization", "Bearer " + getApiKey()), body)
                .map(root -> new ProviderChatResult(
                        providerId(),
                        providerModel,
                        readText(root, "/choices/0/message/content"),
                        false,
                        readInt(root, "/usage/prompt_tokens"),
                        readInt(root, "/usage/completion_tokens"),
                        readInt(root, "/usage/total_tokens")
                ));
    }

    @Override
    public ImageDtos.ImageResponse generateImage(ImageDtos.ImageGenerationRequest request, String providerModel) {
        throw new UnsupportedOperationException("Kimi does not support image generation");
    }

    @Override
    public Mono<ImageDtos.ImageResponse> generateImageAsync(ImageDtos.ImageGenerationRequest request, String providerModel) {
        return Mono.error(new UnsupportedOperationException("Kimi does not support image generation"));
    }

    @Override
    public ImageDtos.ImageResponse editImage(ImageDtos.ImageEditRequest request, String providerModel) {
        throw new UnsupportedOperationException("Kimi does not support image editing");
    }

    @Override
    public Mono<ImageDtos.ImageResponse> editImageAsync(ImageDtos.ImageEditRequest request, String providerModel) {
        return Mono.error(new UnsupportedOperationException("Kimi does not support image editing"));
    }

    @Override
    public List<ProviderModelDescriptor> listModels() {
        try {
            JsonNode root = getJson("/v1/models", Map.of("Authorization", "Bearer " + getApiKey()));
            JsonNode data = root.path("data");
            if (!data.isArray()) {
                return List.of();
            }
            return java.util.stream.StreamSupport.stream(data.spliterator(), false)
                    .map(node -> {
                        String id = node.path("id").asText();
                        return new ProviderModelDescriptor(
                                providerId(),
                                id,
                                id,
                                id,
                                providerId(),
                                true,
                                true,
                                true,
                                true,
                                false,
                                10,
                                inferContextWindow(id),
                                inferInputCost(id),
                                inferOutputCost(id)
                        );
                    })
                    .toList();
        } catch (WebClientResponseException ex) {
            throw mapException(providerId(), ex);
        }
    }

    @Override
    public void streamChat(ChatCompletionRequest request, String providerModel, ProviderStreamFormat format, Consumer<ProviderStreamEvent> consumer) {
        Map<String, Object> body = new HashMap<>();
        body.put("model", providerModel);
        body.put("messages", toMessagePayload(request.messages()));
        body.put("stream", true);
        if (request.temperature() != null) {
            body.put("temperature", request.temperature());
        }
        if (request.max_tokens() != null) {
            body.put("max_tokens", request.max_tokens());
        }
        streamOpenAiSse("/v1/chat/completions", Map.of("Authorization", "Bearer " + getApiKey()), body, consumer, providerId());
    }

    @Override
    public Flux<ProviderStreamEvent> streamChatAsync(ChatCompletionRequest request, String providerModel, ProviderStreamFormat format) {
        Map<String, Object> body = new HashMap<>();
        body.put("model", providerModel);
        body.put("messages", toMessagePayload(request.messages()));
        body.put("stream", true);
        if (request.temperature() != null) {
            body.put("temperature", request.temperature());
        }
        if (request.max_tokens() != null) {
            body.put("max_tokens", request.max_tokens());
        }
        return streamOpenAiSseAsync("/v1/chat/completions", Map.of("Authorization", "Bearer " + getApiKey()), body, providerId());
    }

    private int inferContextWindow(String id) {
        if (id.contains("128k") || id.contains("kimi-k2")) {
            return 128_000;
        }
        if (id.contains("32k")) {
            return 32_000;
        }
        return 128_000;
    }

    private long inferInputCost(String id) {
        if (id.contains("kimi-k2")) {
            return 8L;
        }
        return 6L;
    }

    private long inferOutputCost(String id) {
        if (id.contains("kimi-k2")) {
            return 32L;
        }
        return 18L;
    }
}
