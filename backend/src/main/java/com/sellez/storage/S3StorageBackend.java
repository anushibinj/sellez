package com.sellez.storage;

import com.sellez.config.SellezProperties;
import software.amazon.awssdk.auth.credentials.AnonymousCredentialsProvider;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.net.URI;
import java.util.UUID;

/**
 * Talks to any S3-compatible object store through the plain AWS SDK v2 {@link S3Client} — real AWS
 * S3 when {@code endpoint} is left blank, or a self-hosted gateway (SeaweedFS, MinIO, ...) when it's
 * set. Nothing here is AWS-specific beyond the wire protocol, so swapping providers is config-only.
 */
public class S3StorageBackend implements StorageBackend {
    private final S3Client client;
    private final SellezProperties.Storage.S3 config;

    public S3StorageBackend(SellezProperties properties) {
        this.config = properties.getStorage().getS3();
        boolean customEndpoint = !config.getEndpoint().isBlank();

        S3ClientBuilder builder = S3Client.builder().region(Region.of(config.getRegion()));
        if (customEndpoint) {
            builder.endpointOverride(URI.create(config.getEndpoint()));
        }
        // Path-style (https://host/bucket/key) is what SeaweedFS/MinIO expect; virtual-hosted-style
        // (https://bucket.host/key) is AWS's default, so only force path-style when asked to or when
        // we're clearly not talking to real AWS.
        builder.forcePathStyle(config.isPathStyleAccess() || customEndpoint);

        if (!config.getAccessKey().isBlank() && !config.getSecretKey().isBlank()) {
            builder.credentialsProvider(StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(config.getAccessKey(), config.getSecretKey())));
        } else if (customEndpoint) {
            // An unauthenticated dev gateway (e.g. SeaweedFS with no IAM configured) — the SDK still
            // requires *a* credentials provider, so hand it one that signs nothing.
            builder.credentialsProvider(AnonymousCredentialsProvider.create());
        }
        // Otherwise fall through to the SDK's default credential chain (env vars, IAM role, ~/.aws, ...).

        this.client = builder.build();
    }

    @Override
    public String write(byte[] content, String extension) {
        String key = UUID.randomUUID() + "." + extension;
        client.putObject(
                PutObjectRequest.builder()
                        .bucket(config.getBucket())
                        .key(key)
                        .contentType("image/" + extension)
                        .contentLength((long) content.length)
                        .build(),
                RequestBody.fromBytes(content));
        return key;
    }

    @Override
    public String publicUrl(String key) {
        if (key == null) {
            return null;
        }
        if (!config.getPublicBaseUrl().isBlank()) {
            String base = config.getPublicBaseUrl();
            return (base.endsWith("/") ? base : base + "/") + key;
        }
        if (!config.getEndpoint().isBlank()) {
            String base = config.getEndpoint().endsWith("/")
                    ? config.getEndpoint().substring(0, config.getEndpoint().length() - 1)
                    : config.getEndpoint();
            return base + "/" + config.getBucket() + "/" + key;
        }
        return "https://" + config.getBucket() + ".s3." + config.getRegion() + ".amazonaws.com/" + key;
    }
}
