package com.qizlan.llm.gateway.gateway.service;

import com.qizlan.llm.gateway.gateway.dto.ModelDto;
import com.qizlan.llm.gateway.persistence.entity.ModelEntity;
import com.qizlan.llm.gateway.persistence.entity.ModelProviderMappingEntity;
import com.qizlan.llm.gateway.persistence.repository.ModelProviderMappingRepository;
import com.qizlan.llm.gateway.persistence.repository.ModelRepository;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class ModelCatalogService {

    private final ModelRepository modelRepository;
    private final ModelProviderMappingRepository mappingRepository;
    private final RoutingProjectionInvalidationService routingProjectionInvalidationService;

    public ModelCatalogService(
            ModelRepository modelRepository,
            ModelProviderMappingRepository mappingRepository,
            RoutingProjectionInvalidationService routingProjectionInvalidationService
    ) {
        this.modelRepository = modelRepository;
        this.mappingRepository = mappingRepository;
        this.routingProjectionInvalidationService = routingProjectionInvalidationService;
    }

    public List<ModelDto> listModels() {
        routingProjectionInvalidationService.refreshIfNeeded();
        Map<String, List<ModelProviderMappingEntity>> grouped = mappingRepository.findAll().stream()
                .filter(ModelProviderMappingEntity::isActive)
                .filter(mapping -> !mapping.getModel().isArchived())
                .collect(Collectors.groupingBy(mapping -> mapping.getModel().getId()));

        return grouped.values().stream()
                .map(group -> {
                    ModelProviderMappingEntity first = group.get(0);
                    List<String> inputModalities = first.getModel().isSupportsVision() ? List.of("text", "image") : List.of("text");
                    List<String> outputModalities = first.getModel().isImageGeneration() ? List.of("text", "image") : List.of("text");
                    return new ModelDto(
                            first.getModel().getId(),
                            first.getModel().getName(),
                            first.getModel().getFamily(),
                            first.getModel().isFreeModel(),
                            first.getModel().getContextWindowTokens(),
                            first.getModel().getInputCostMicrosPerToken(),
                            first.getModel().getOutputCostMicrosPerToken(),
                            first.getModel().isBuiltin(),
                            new ModelDto.Architecture(inputModalities, outputModalities),
                            group.stream()
                                    .map(mapping -> new ModelDto.ProviderSupport(
                                            mapping.getProvider().getId(),
                                            mapping.getModelName(),
                                            mapping.isStreaming(),
                                            mapping.isVision(),
                                            mapping.isTools(),
                                            mapping.isReasoning()))
                                    .toList()
                    );
                })
                .toList();
    }

    public ModelEntity createModel(String id, String name, String family, boolean freeModel,
                                   boolean supportsVision, boolean supportsTools, boolean supportsReasoning,
                                   boolean supportsStreaming, boolean imageGeneration,
                                   int contextWindowTokens, long inputCostMicrosPerToken,
                                   long outputCostMicrosPerToken) {
        if (modelRepository.existsById(id)) {
            throw new IllegalArgumentException("Model with id '" + id + "' already exists");
        }
        ModelEntity model = new ModelEntity(
                id, name, family, freeModel, supportsVision, supportsTools,
                supportsReasoning, supportsStreaming, imageGeneration, false
        );
        model.refreshMetadata(name, family, freeModel, supportsVision, supportsTools,
                supportsReasoning, supportsStreaming, imageGeneration,
                contextWindowTokens, inputCostMicrosPerToken, outputCostMicrosPerToken);
        ModelEntity saved = modelRepository.save(model);
        routingProjectionInvalidationService.invalidate();
        return saved;
    }

    public ModelEntity updateModel(String id, String name, String family, Boolean freeModel,
                                   Boolean supportsVision, Boolean supportsTools, Boolean supportsReasoning,
                                   Boolean supportsStreaming, Boolean imageGeneration,
                                   Integer contextWindowTokens, Long inputCostMicrosPerToken,
                                   Long outputCostMicrosPerToken) {
        ModelEntity model = modelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Model with id '" + id + "' not found"));
        if (model.isBuiltin()) {
            throw new IllegalStateException("Built-in models cannot be modified");
        }
        model.refreshMetadata(
                name != null ? name : model.getName(),
                family != null ? family : model.getFamily(),
                freeModel != null ? freeModel : model.isFreeModel(),
                supportsVision != null ? supportsVision : model.isSupportsVision(),
                supportsTools != null ? supportsTools : model.isSupportsTools(),
                supportsReasoning != null ? supportsReasoning : model.isSupportsReasoning(),
                supportsStreaming != null ? supportsStreaming : model.isSupportsStreaming(),
                imageGeneration != null ? imageGeneration : model.isImageGeneration(),
                contextWindowTokens != null ? contextWindowTokens : model.getContextWindowTokens(),
                inputCostMicrosPerToken != null ? inputCostMicrosPerToken : model.getInputCostMicrosPerToken(),
                outputCostMicrosPerToken != null ? outputCostMicrosPerToken : model.getOutputCostMicrosPerToken()
        );
        ModelEntity saved = modelRepository.save(model);
        routingProjectionInvalidationService.invalidate();
        return saved;
    }

    public void deleteModel(String id) {
        ModelEntity model = modelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Model with id '" + id + "' not found"));
        if (model.isBuiltin()) {
            throw new IllegalStateException("Built-in models cannot be deleted");
        }
        model.setArchived(true);
        modelRepository.save(model);
        routingProjectionInvalidationService.invalidate();
    }
}
