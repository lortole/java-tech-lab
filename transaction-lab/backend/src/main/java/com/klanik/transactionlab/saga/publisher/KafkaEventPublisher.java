package com.klanik.transactionlab.saga.publisher;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("!local")
@RequiredArgsConstructor
public class KafkaEventPublisher implements EventPublisher {
    private final KafkaTemplate<String, Object> kafka;

    @Override
    public void publish(String topic, String key, Object event) {
        kafka.send(topic, key, event);
        log.debug("[KAFKA] topic={} key={}", topic, key);
    }
}
