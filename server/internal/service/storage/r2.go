package storage

import (
	"context"
	"fmt"
	"io"
	"server/internal/config"
	"server/internal/utils"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
)

type R2Service struct {
	cfg    *config.Config
	client *s3.S3
}

func NewR2Service(cfg *config.Config) *R2Service {
	// R2 is S3 compatible, we use the S3 SDK with custom endpoint
	s3Config := &aws.Config{
		Credentials:      credentials.NewStaticCredentials(cfg.R2.AccessKey, cfg.R2.SecretKey, ""),
		Endpoint:         aws.String(fmt.Sprintf("https://%s.r2.cloudflarestorage.com", cfg.R2.AccountID)),
		Region:           aws.String("auto"), // R2 region is auto
		S3ForcePathStyle: aws.Bool(true),
	}

	sess := session.Must(session.NewSession(s3Config))
	return &R2Service{
		cfg:    cfg,
		client: s3.New(sess),
	}
}

// Upload uploads a file to R2 and returns the public URL
func (s *R2Service) Upload(ctx context.Context, key string, body io.ReadSeeker, contentType string) (string, error) {
	_, err := s.client.PutObjectWithContext(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.cfg.R2.BucketName),
		Key:         aws.String(key),
		Body:        body,
		ContentType: aws.String(contentType),
	})

	if err != nil {
		utils.Error("r2 upload failed", err, map[string]any{"key": key})
		return "", err
	}

	// Return public CDN URL
	return fmt.Sprintf("%s/%s", s.cfg.R2.PublicURL, key), nil
}

// Delete removes a file from R2
func (s *R2Service) Delete(ctx context.Context, key string) error {
	_, err := s.client.DeleteObjectWithContext(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.cfg.R2.BucketName),
		Key:    aws.String(key),
	})

	if err != nil {
		utils.Error("r2 delete failed", err, map[string]any{"key": key})
		return err
	}

	return nil
}

// Download retrieves a file from R2
func (s *R2Service) Download(ctx context.Context, key string) (io.ReadCloser, error) {
	out, err := s.client.GetObjectWithContext(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.cfg.R2.BucketName),
		Key:    aws.String(key),
	})

	if err != nil {
		utils.Error("r2 download failed", err, map[string]any{"key": key})
		return nil, err
	}

	return out.Body, nil
}
