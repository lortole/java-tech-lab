package com.klanik.transactionlab.saga.publisher;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Primary
@ConditionalOnMissingBean(KafkaEventPublisher.class)
public class MockEventPublisher implements EventPublisher {
    @Override
    public void publish(String topic, String key, Object event) {
        log.info("[KAFKA-MOCK] → topic={} key={} payload={}", topic, key, event);
    }
}
