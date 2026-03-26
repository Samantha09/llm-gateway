package com.qizlan.llm.gateway.gateway.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.qizlan.llm.gateway.config.GatewayProperties;
import com.qizlan.llm.gateway.gateway.dto.ChatCompletionRequest;
import com.qizlan.llm.gateway.gateway.dto.ImageDtos;
import com.qizlan.llm.gateway.gateway.service.ProviderKeyService;
import io.micrometer.tracing.Tracer;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Consumer;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Component
public class KimiCodeplanProviderAdapter extends AbstractHttpProviderAdapter {

    private final ProviderKeyService providerKeyService;

    public KimiCodeplanProviderAdapter(GatewayProperties properties, ObjectMapper objectMapper, Tracer tracer,
                                       ProviderKeyService providerKeyService) {
        super(properties.providers().kimiCodeplan().baseUrl(), objectMapper, tracer);
        this.providerKeyService = providerKeyService;
    }

    private String getApiKey() {
        return providerKeyService.getApiKey("kimi-codeplan")
                .orElseThrow(() -> new IllegalStateException("No API key configured for provider: kimi-codeplan"));
    }

    @Override
    public String providerId() {
        return "kimi-codeplan";
    }

    @Override
    public ProviderChatResult complete(ChatCompletionRequest request, String providerModel) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("model", providerModel);
            body.put("messages", toMessagePayload(request.messages()));
            body.put("max_tokens", request.max_tokens() == null ? 4096 : request.max_tokens());
            body.put("stream", false);
            if (request.temperature() != null) {
                body.put("temperature", request.temperature());
            }
            // Kimi CodePlan uses Anthropic API format with specific User-Agent
            // Use relative path v1/messages - baseUrl should be https://api.kimi.com/coding
            System.out.println("[DEBUG] KimiCodePlan baseUrl: " + baseUrl + ", requesting: v1/messages");
            JsonNode root = postJson("v1/messages", Map.of(
                    "x-api-key", getApiKey(),
                    "anthropic-version", "2023-06-01",
                    "User-Agent", "Anthropic/JS 0.73.0"), body);
            return new ProviderChatResult(
                    providerId(),
                    providerModel,
                    readText(root, "/content/0/text"),
                    false,
                    readInt(root, "/usage/input_tokens"),
                    readInt(root, "/usage/output_tokens"),
                    sum(readInt(root, "/usage/input_tokens"), readInt(root, "/usage/output_tokens"))
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
        body.put("max_tokens", request.max_tokens() == null ? 4096 : request.max_tokens());
        body.put("stream", false);
        if (request.temperature() != null) {
            body.put("temperature", request.temperature());
        }
        return postJsonAsync("v1/messages", Map.of(
                        "x-api-key", getApiKey(),
                        "anthropic-version", "2023-06-01",
                        "User-Agent", "Anthropic/JS 0.73.0"), body)
                .map(root -> new ProviderChatResult(
                        providerId(),
                        providerModel,
                        readText(root, "/content/0/text"),
                        false,
                        readInt(root, "/usage/input_tokens"),
                        readInt(root, "/usage/output_tokens"),
                        sum(readInt(root, "/usage/input_tokens"), readInt(root, "/usage/output_tokens"))
                ));
    }

    @Override
    public ImageDtos.ImageResponse generateImage(ImageDtos.ImageGenerationRequest request, String providerModel) {
        throw new UnsupportedOperationException("Kimi CodePlan does not support image generation");
    }

    @Override
    public Mono<ImageDtos.ImageResponse> generateImageAsync(ImageDtos.ImageGenerationRequest request, String providerModel) {
        return Mono.error(new UnsupportedOperationException("Kimi CodePlan does not support image generation"));
    }

    @Override
    public ImageDtos.ImageResponse editImage(ImageDtos.ImageEditRequest request, String providerModel) {
        throw new UnsupportedOperationException("Kimi CodePlan does not support image editing");
    }

    @Override
    public Mono<ImageDtos.ImageResponse> editImageAsync(ImageDtos.ImageEditRequest request, String providerModel) {
        return Mono.error(new UnsupportedOperationException("Kimi CodePlan does not support image editing"));
    }

    @Override
    public List<ProviderModelDescriptor> listModels() {
        // Kimi CodePlan uses fixed model list per openclaw reference
        return List.of(
                new ProviderModelDescriptor(
                        providerId(),
                        "kimi-code",
                        "kimi-code",
                        "Kimi Code",
                        providerId(),
                        true,
                        true,
                        true,
                        true,
                        false,
                        10,
                        262_144,
                        0L,
                        0L
                ),
                new ProviderModelDescriptor(
                        providerId(),
                        "k2p5",
                        "k2p5",
                        "Kimi Code (legacy model id)",
                        providerId(),
                        true,
                        true,
                        true,
                        true,
                        false,
                        10,
                        262_144,
                        0L,
                        0L
                )
        );
    }

    @Override
    public void streamChat(ChatCompletionRequest request, String providerModel, ProviderStreamFormat format, Consumer<ProviderStreamEvent> consumer) {
        Map<String, Object> body = new HashMap<>();
        body.put("model", providerModel);
        body.put("messages", toMessagePayload(request.messages()));
        body.put("max_tokens", request.max_tokens() == null ? 4096 : request.max_tokens());
        body.put("stream", true);
        if (request.temperature() != null) {
            body.put("temperature", request.temperature());
        }
        // Use Anthropic SSE format for streaming
        streamAnthropicSse("v1/messages", Map.of(
                "x-api-key", getApiKey(),
                "anthropic-version", "2023-06-01",
                "User-Agent", "Anthropic/JS 0.73.0"), body, consumer, providerId());
    }

    @Override
    public Flux<ProviderStreamEvent> streamChatAsync(ChatCompletionRequest request, String providerModel, ProviderStreamFormat format) {
        Map<String, Object> body = new HashMap<>();
        body.put("model", providerModel);
        body.put("messages", toMessagePayload(request.messages()));
        body.put("max_tokens", request.max_tokens() == null ? 4096 : request.max_tokens());
        body.put("stream", true);
        if (request.temperature() != null) {
            body.put("temperature", request.temperature());
        }
        // Use Anthropic SSE format for streaming
        return streamAnthropicSseAsync("v1/messages", Map.of(
                "x-api-key", getApiKey(),
                "anthropic-version", "2023-06-01",
                "User-Agent", "Anthropic/JS 0.73.0"), body, providerId());
    }

    private Integer sum(Integer a, Integer b) {
        if (a == null && b == null) {
            return null;
        }
        return (a == null ? 0 : a) + (b == null ? 0 : b);
    }
}
