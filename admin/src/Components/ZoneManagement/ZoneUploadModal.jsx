import { useState } from "react";
import PropTypes from "prop-types";
import {
  Modal,
  Text,
  Group,
  Button,
  FileInput,
  Progress,
  Alert,
  List,
  Paper,
  Stack,
  Badge,
  Divider,
} from "@mantine/core";
import {
  IconUpload,
  IconFile,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconDownload,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { uploadZoneExcel } from "../../utils/zoneApi";

const ZoneUploadModal = ({ opened, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const resetModal = () => {
    setFile(null);
    setUploading(false);
    setUploadResult(null);
    setUploadProgress(0);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!file) {
      notifications.show({
        title: "Error",
        message: "Please select an Excel file",
        color: "red",
        icon: <IconX />,
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      const result = await uploadZoneExcel(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        setUploadResult(result);

        notifications.show({
          title: "Upload Successful",
          message: `Created ${result.results.zonesCreated} zones and ${result.results.pincodesCreated} pincodes`,
          color: "green",
          icon: <IconCheck />,
        });

        // If successful, close modal after a delay
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      } else {
        setUploadResult(result);
        notifications.show({
          title: "Upload Failed",
          message: result.error || "Failed to upload Excel file",
          color: "red",
          icon: <IconX />,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadResult({
        success: false,
        error: error.message || "Upload failed",
      });

      notifications.show({
        title: "Upload Error",
        message: error.message || "An error occurred during upload",
        color: "red",
        icon: <IconX />,
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleExcel = () => {
    window.open("/api/zones/sample-csv", "_blank");
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Upload Zone & Pincode Excel"
      size="lg"
      centered
    >
      <Stack spacing="md">
        {/* Instructions */}
        <Alert icon={<IconAlertTriangle />} title="Excel Format Requirements">
          <Text size="sm" mb="xs">
            Your Excel file should have the following columns in the first
            sheet:
          </Text>
          <List size="sm">
            <List.Item>
              <strong>zone_name</strong>: Name of the delivery zone
            </List.Item>
            <List.Item>
              <strong>pincode</strong>: 6-digit pincode
            </List.Item>
            <List.Item>
              <strong>city</strong>: City name (optional)
            </List.Item>
            <List.Item>
              <strong>state</strong>: State name (optional)
            </List.Item>
          </List>
        </Alert>

        {/* Sample Excel Download */}
        <Paper withBorder p="md" bg="gray.0">
          <Group justify="space-between">
            <div>
              <Text weight={500} size="sm">
                Download Sample Excel
              </Text>
              <Text size="xs" color="dimmed">
                Get a template file to see the correct format
              </Text>
            </div>
            <Button
              variant="light"
              leftSection={<IconDownload size={16} />}
              onClick={downloadSampleExcel}
            >
              Download
            </Button>
          </Group>
        </Paper>

        <Divider />

        {/* File Upload */}
        <div>
          <Text weight={500} mb="xs">
            Select Excel File
          </Text>
          <FileInput
            placeholder="Choose Excel file"
            accept=".xlsx,.xls,.csv"
            value={file}
            onChange={handleFileSelect}
            icon={<IconFile />}
            disabled={uploading}
          />
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div>
            <Text size="sm" mb="xs">
              Uploading and processing Excel...
            </Text>
            <Progress value={uploadProgress} animated />
          </div>
        )}

        {/* Upload Results */}
        {uploadResult && (
          <Paper
            withBorder
            p="md"
            bg={uploadResult.success ? "green.0" : "red.0"}
          >
            <Group align="flex-start" spacing="sm">
              {uploadResult.success ? (
                <IconCheck color="green" size={20} />
              ) : (
                <IconX color="red" size={20} />
              )}
              <div style={{ flex: 1 }}>
                <Text
                  weight={500}
                  color={uploadResult.success ? "green" : "red"}
                >
                  {uploadResult.success
                    ? "Upload Successful!"
                    : "Upload Failed"}
                </Text>

                {uploadResult.success && uploadResult.results && (
                  <Stack spacing="xs" mt="sm">
                    <Group spacing="lg">
                      <Badge color="blue" variant="light">
                        Zones Created: {uploadResult.results.zonesCreated}
                      </Badge>
                      <Badge color="green" variant="light">
                        Zones Updated: {uploadResult.results.zonesUpdated}
                      </Badge>
                    </Group>
                    <Group spacing="lg">
                      <Badge color="orange" variant="light">
                        Pincodes Created: {uploadResult.results.pincodesCreated}
                      </Badge>
                      <Badge color="yellow" variant="light">
                        Pincodes Updated: {uploadResult.results.pincodesUpdated}
                      </Badge>
                    </Group>

                    {uploadResult.results.errors &&
                      uploadResult.results.errors.length > 0 && (
                        <div>
                          <Text size="sm" color="red" weight={500} mt="sm">
                            Errors ({uploadResult.results.errors.length}):
                          </Text>
                          <List size="xs" mt="xs">
                            {uploadResult.results.errors
                              .slice(0, 5)
                              .map((error, index) => (
                                <List.Item
                                  key={index}
                                  icon={<IconX size={12} />}
                                >
                                  {error}
                                </List.Item>
                              ))}
                            {uploadResult.results.errors.length > 5 && (
                              <List.Item>
                                ... and {uploadResult.results.errors.length - 5}{" "}
                                more errors
                              </List.Item>
                            )}
                          </List>
                        </div>
                      )}
                  </Stack>
                )}

                {!uploadResult.success && (
                  <Text size="sm" mt="xs" color="red">
                    {uploadResult.error || uploadResult.message}
                  </Text>
                )}

                {uploadResult.details &&
                  Array.isArray(uploadResult.details) && (
                    <div>
                      <Text size="sm" color="red" weight={500} mt="sm">
                        Details:
                      </Text>
                      <List size="xs" mt="xs">
                        {uploadResult.details
                          .slice(0, 5)
                          .map((detail, index) => (
                            <List.Item key={index} icon={<IconX size={12} />}>
                              Row {detail.row}: {detail.error}
                            </List.Item>
                          ))}
                        {uploadResult.details.length > 5 && (
                          <List.Item>
                            ... and {uploadResult.details.length - 5} more
                            issues
                          </List.Item>
                        )}
                      </List>
                    </div>
                  )}
              </div>
            </Group>
          </Paper>
        )}

        {/* Action Buttons */}
        <Group justify="flex-end" spacing="sm">
          <Button variant="subtle" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            leftSection={<IconUpload size={16} />}
            onClick={handleUpload}
            loading={uploading}
            disabled={!file || uploading}
          >
            {uploading ? "Uploading..." : "Upload Excel"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

ZoneUploadModal.propTypes = {
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default ZoneUploadModal;
