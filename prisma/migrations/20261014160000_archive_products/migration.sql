SET @archive_product_column_migration = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Product'
        AND COLUMN_NAME = 'archivedAt'
    ),
    'SELECT 1',
    'ALTER TABLE `Product` ADD COLUMN `archivedAt` DATETIME(3) NULL'
  )
);
PREPARE archive_product_column_statement FROM @archive_product_column_migration;
EXECUTE archive_product_column_statement;
DEALLOCATE PREPARE archive_product_column_statement;
