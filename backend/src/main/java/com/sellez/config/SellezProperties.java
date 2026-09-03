package com.sellez.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Arrays;
import java.util.List;

@ConfigurationProperties(prefix = "sellez")
public class SellezProperties {
    private Cors cors = new Cors();
    private Security security = new Security();
    private Auth auth = new Auth();
    private SuperAdmin superAdmin = new SuperAdmin();
    private Storage storage = new Storage();
    private Email email = new Email();
    private Listing listing = new Listing();
    private Chat chat = new Chat();
    private Jobs jobs = new Jobs();

    public Cors getCors() { return cors; }
    public Security getSecurity() { return security; }
    public Auth getAuth() { return auth; }
    public SuperAdmin getSuperAdmin() { return superAdmin; }
    public Storage getStorage() { return storage; }
    public Email getEmail() { return email; }
    public Listing getListing() { return listing; }
    public Chat getChat() { return chat; }
    public Jobs getJobs() { return jobs; }

    public static class Cors {
        private String allowedOrigins = "http://localhost:3000";
        public List<String> origins() {
            return Arrays.stream(allowedOrigins.split(",")).map(String::trim).filter(s -> !s.isBlank()).toList();
        }
        public String getAllowedOrigins() { return allowedOrigins; }
        public void setAllowedOrigins(String allowedOrigins) { this.allowedOrigins = allowedOrigins; }
    }

    public static class Security {
        private String jwtSecret;
        private long accessTokenMinutes = 15;
        private long refreshTokenDays = 30;
        private boolean cookieSecure = false;
        private String cookieSamesite = "Lax";
        private String cookieDomain = "";
        private String accessCookieName = "sellez_access";
        private String refreshCookieName = "sellez_refresh";
        public String getJwtSecret() { return jwtSecret; }
        public void setJwtSecret(String jwtSecret) { this.jwtSecret = jwtSecret; }
        public long getAccessTokenMinutes() { return accessTokenMinutes; }
        public void setAccessTokenMinutes(long accessTokenMinutes) { this.accessTokenMinutes = accessTokenMinutes; }
        public long getRefreshTokenDays() { return refreshTokenDays; }
        public void setRefreshTokenDays(long refreshTokenDays) { this.refreshTokenDays = refreshTokenDays; }
        public boolean isCookieSecure() { return cookieSecure; }
        public void setCookieSecure(boolean cookieSecure) { this.cookieSecure = cookieSecure; }
        public String getCookieSamesite() { return cookieSamesite; }
        public void setCookieSamesite(String cookieSamesite) { this.cookieSamesite = cookieSamesite; }
        public String getCookieDomain() { return cookieDomain; }
        public void setCookieDomain(String cookieDomain) { this.cookieDomain = cookieDomain; }
        public String getAccessCookieName() { return accessCookieName; }
        public void setAccessCookieName(String accessCookieName) { this.accessCookieName = accessCookieName; }
        public String getRefreshCookieName() { return refreshCookieName; }
        public void setRefreshCookieName(String refreshCookieName) { this.refreshCookieName = refreshCookieName; }
    }

    public static class Auth {
        private int otpTtlMinutes = 10;
        private int otpMaxAttempts = 5;
        private int otpSendLimit = 5;
        private int otpSendWindowMinutes = 10;
        private String otpFixedCode = "";
        public int getOtpTtlMinutes() { return otpTtlMinutes; }
        public void setOtpTtlMinutes(int otpTtlMinutes) { this.otpTtlMinutes = otpTtlMinutes; }
        public int getOtpMaxAttempts() { return otpMaxAttempts; }
        public void setOtpMaxAttempts(int otpMaxAttempts) { this.otpMaxAttempts = otpMaxAttempts; }
        public int getOtpSendLimit() { return otpSendLimit; }
        public void setOtpSendLimit(int otpSendLimit) { this.otpSendLimit = otpSendLimit; }
        public int getOtpSendWindowMinutes() { return otpSendWindowMinutes; }
        public void setOtpSendWindowMinutes(int otpSendWindowMinutes) { this.otpSendWindowMinutes = otpSendWindowMinutes; }
        public String getOtpFixedCode() { return otpFixedCode; }
        public void setOtpFixedCode(String otpFixedCode) { this.otpFixedCode = otpFixedCode; }
    }

    public static class SuperAdmin {
        private String emails = "";
        public List<String> emailList() {
            return Arrays.stream(emails.split(",")).map(String::trim).map(String::toLowerCase).filter(s -> !s.isBlank()).toList();
        }
        public String getEmails() { return emails; }
        public void setEmails(String emails) { this.emails = emails; }
    }

    public static class Storage {
        /** Which backend actually persists uploaded files: "local", "s3", or "firebase". */
        private String type = "local";
        private String localPath = "./uploads";
        private String publicBaseUrl = "http://localhost:8080/api/media";
        private int imageMaxDimension = 1600;
        private float imageQuality = 0.82f;
        private S3 s3 = new S3();
        private Firebase firebase = new Firebase();

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getLocalPath() { return localPath; }
        public void setLocalPath(String localPath) { this.localPath = localPath; }
        public String getPublicBaseUrl() { return publicBaseUrl; }
        public void setPublicBaseUrl(String publicBaseUrl) { this.publicBaseUrl = publicBaseUrl; }
        public int getImageMaxDimension() { return imageMaxDimension; }
        public void setImageMaxDimension(int imageMaxDimension) { this.imageMaxDimension = imageMaxDimension; }
        public float getImageQuality() { return imageQuality; }
        public void setImageQuality(float imageQuality) { this.imageQuality = imageQuality; }
        public S3 getS3() { return s3; }
        public void setS3(S3 s3) { this.s3 = s3; }
        public Firebase getFirebase() { return firebase; }
        public void setFirebase(Firebase firebase) { this.firebase = firebase; }

        public static class S3 {
            private String bucket = "";
            private String region = "us-east-1";
            /** Custom endpoint for an S3-compatible server (SeaweedFS, MinIO, R2, ...); blank means real AWS. */
            private String endpoint = "";
            private String accessKey = "";
            private String secretKey = "";
            /** SeaweedFS/MinIO-style servers typically need path-style bucket addressing. */
            private boolean pathStyleAccess = false;
            /** Optional override for the URL handed back to clients (e.g. a CDN in front of the bucket). */
            private String publicBaseUrl = "";

            public String getBucket() { return bucket; }
            public void setBucket(String bucket) { this.bucket = bucket; }
            public String getRegion() { return region; }
            public void setRegion(String region) { this.region = region; }
            public String getEndpoint() { return endpoint; }
            public void setEndpoint(String endpoint) { this.endpoint = endpoint; }
            public String getAccessKey() { return accessKey; }
            public void setAccessKey(String accessKey) { this.accessKey = accessKey; }
            public String getSecretKey() { return secretKey; }
            public void setSecretKey(String secretKey) { this.secretKey = secretKey; }
            public boolean isPathStyleAccess() { return pathStyleAccess; }
            public void setPathStyleAccess(boolean pathStyleAccess) { this.pathStyleAccess = pathStyleAccess; }
            public String getPublicBaseUrl() { return publicBaseUrl; }
            public void setPublicBaseUrl(String publicBaseUrl) { this.publicBaseUrl = publicBaseUrl; }
        }

        public static class Firebase {
            /** Firebase Storage bucket name, e.g. my-project.appspot.com. */
            private String bucket = "";
            /** Path to a service-account JSON key; blank falls back to Application Default Credentials. */
            private String credentialsPath = "";

            public String getBucket() { return bucket; }
            public void setBucket(String bucket) { this.bucket = bucket; }
            public String getCredentialsPath() { return credentialsPath; }
            public void setCredentialsPath(String credentialsPath) { this.credentialsPath = credentialsPath; }
        }
    }

    public static class Email {
        private String provider = "logging";
        private String from = "noreply@sellez.local";
        private String awsRegion = "us-east-1";
        private String snsTopicArn = "";
        public String getProvider() { return provider; }
        public void setProvider(String provider) { this.provider = provider; }
        public String getFrom() { return from; }
        public void setFrom(String from) { this.from = from; }
        public String getAwsRegion() { return awsRegion; }
        public void setAwsRegion(String awsRegion) { this.awsRegion = awsRegion; }
        public String getSnsTopicArn() { return snsTopicArn; }
        public void setSnsTopicArn(String snsTopicArn) { this.snsTopicArn = snsTopicArn; }
    }

    public static class Listing {
        private int maxImages = 6;
        private String currencies = "USD,INR,EUR,GBP,AED,CAD,AUD";
        private String defaultCurrency = "USD";
        public int getMaxImages() { return maxImages; }
        public void setMaxImages(int maxImages) { this.maxImages = maxImages; }
        public List<String> allowedCurrencies() {
            return Arrays.stream(currencies.split(",")).map(String::trim).map(String::toUpperCase).filter(s -> !s.isBlank()).toList();
        }
        public String getCurrencies() { return currencies; }
        public void setCurrencies(String currencies) { this.currencies = currencies; }
        public String getDefaultCurrency() { return defaultCurrency; }
        public void setDefaultCurrency(String defaultCurrency) { this.defaultCurrency = defaultCurrency; }
    }

    public static class Chat {
        private long maxImageBytes = 5_242_880;
        public long getMaxImageBytes() { return maxImageBytes; }
        public void setMaxImageBytes(long maxImageBytes) { this.maxImageBytes = maxImageBytes; }
    }

    public static class Jobs {
        private long banExpiryMs = 60000;
        public long getBanExpiryMs() { return banExpiryMs; }
        public void setBanExpiryMs(long banExpiryMs) { this.banExpiryMs = banExpiryMs; }
    }
}
