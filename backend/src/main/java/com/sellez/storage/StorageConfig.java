package com.sellez.storage;

import com.sellez.config.SellezProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

/** Wires up exactly one {@link StorageBackend} bean, chosen by {@code sellez.storage.type}. */
@Configuration
public class StorageConfig {

    @Bean
    @ConditionalOnProperty(prefix = "sellez.storage", name = "type", havingValue = "local", matchIfMissing = true)
    public StorageBackend localStorageBackend(SellezProperties properties) {
        return new LocalStorageBackend(properties);
    }

    @Bean
    @ConditionalOnProperty(prefix = "sellez.storage", name = "type", havingValue = "s3")
    public StorageBackend s3StorageBackend(SellezProperties properties) {
        return new S3StorageBackend(properties);
    }

    @Bean
    @ConditionalOnProperty(prefix = "sellez.storage", name = "type", havingValue = "firebase")
    public StorageBackend firebaseStorageBackend(SellezProperties properties) throws IOException {
        return new FirebaseStorageBackend(properties);
    }
}
