import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Modal,
  Title,
  Text,
  Group,
  Button,
  Badge,
  Table,
  Stack,
  Paper,
  Loader,
  Alert,
  Pagination,
  TextInput,
} from "@mantine/core";
import {
  IconMapPin,
  IconWorld,
  IconSearch,
  IconInfoCircle,
} from "@tabler/icons-react";
import { fetchZoneById } from "../../utils/zoneApi";

const ZoneDetailsModal = ({ opened, onClose, zone }) => {
  const [zoneDetails, setZoneDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pincodeSearch, setPincodeSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pincodesPerPage = 10;

  const loadZoneDetails = useCallback(async () => {
    if (!zone?.id) return;

    setLoading(true);
    try {
      const response = await fetchZoneById(zone.id);
      if (response.success) {
        setZoneDetails(response.data);
      }
    } catch (error) {
      console.error("Failed to load zone details:", error);
    } finally {
      setLoading(false);
    }
  }, [zone]);

  useEffect(() => {
    if (opened && zone) {
      loadZoneDetails();
    }
  }, [opened, zone, loadZoneDetails]);

  const handleClose = () => {
    setZoneDetails(null);
    setPincodeSearch("");
    setCurrentPage(1);
    onClose();
  };

  // Filter pincodes based on search
  const filteredPincodes =
    zoneDetails?.pincodes?.filter(
      (pincode) =>
        pincode.pincode.includes(pincodeSearch) ||
        pincode.city?.toLowerCase().includes(pincodeSearch.toLowerCase()) ||
        pincode.state?.toLowerCase().includes(pincodeSearch.toLowerCase())
    ) || [];

  // Paginate pincodes
  const totalPages = Math.ceil(filteredPincodes.length / pincodesPerPage);
  const paginatedPincodes = filteredPincodes.slice(
    (currentPage - 1) * pincodesPerPage,
    currentPage * pincodesPerPage
  );

  if (!zone) return null;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Zone Details"
      size="lg"
      centered
    >
      <Stack spacing="md">
        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <Loader />
            <Text mt="md">Loading zone details...</Text>
          </div>
        ) : (
          <>
            {/* Zone Information */}
            <Paper withBorder p="md">
              <Group justify="space-between" align="flex-start">
                <div style={{ flex: 1 }}>
                  <Group align="center" mb="sm">
                    <Title order={5}>
                      {zoneDetails?.display_name || zone.display_name}
                    </Title>
                    <Badge
                      color={
                        zoneDetails?.is_nationwide || zone.is_nationwide
                          ? "blue"
                          : "orange"
                      }
                      variant="light"
                      leftSection={
                        zoneDetails?.is_nationwide || zone.is_nationwide ? (
                          <IconWorld size={12} />
                        ) : (
                          <IconMapPin size={12} />
                        )
                      }
                    >
                      {zoneDetails?.is_nationwide || zone.is_nationwide
                        ? "Nationwide"
                        : "Zonal"}
                    </Badge>
                    <Badge
                      color={
                        zoneDetails?.is_active || zone.is_active
                          ? "green"
                          : "red"
                      }
                      variant="light"
                    >
                      {zoneDetails?.is_active || zone.is_active
                        ? "Active"
                        : "Inactive"}
                    </Badge>
                  </Group>

                  <Text size="sm" color="dimmed" mb="xs">
                    <strong>Zone Name:</strong> {zoneDetails?.name || zone.name}
                  </Text>

                  {(zoneDetails?.description || zone.description) && (
                    <Text size="sm" color="dimmed" mb="xs">
                      <strong>Description:</strong>{" "}
                      {zoneDetails?.description || zone.description}
                    </Text>
                  )}

                  <Text size="sm" color="dimmed">
                    <strong>Created:</strong>{" "}
                    {new Date(
                      zoneDetails?.created_at || zone.created_at
                    ).toLocaleString()}
                  </Text>

                  {(zoneDetails?.updated_at || zone.updated_at) && (
                    <Text size="sm" color="dimmed">
                      <strong>Last Updated:</strong>{" "}
                      {new Date(
                        zoneDetails?.updated_at || zone.updated_at
                      ).toLocaleString()}
                    </Text>
                  )}
                </div>
              </Group>
            </Paper>

            {/* Pincodes Section */}
            {!(zoneDetails?.is_nationwide || zone.is_nationwide) && (
              <>
                <Group justify="space-between" align="center">
                  <Title order={6}>Pincodes ({filteredPincodes.length})</Title>
                  <TextInput
                    placeholder="Search pincodes, city, or state..."
                    value={pincodeSearch}
                    onChange={(e) => {
                      setPincodeSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    leftSection={<IconSearch size={16} />}
                    style={{ width: 300 }}
                  />
                </Group>

                {filteredPincodes.length === 0 ? (
                  <Alert icon={<IconInfoCircle />} title="No pincodes found">
                    {pincodeSearch
                      ? `No pincodes match "${pincodeSearch}"`
                      : "This zone has no pincodes assigned."}
                  </Alert>
                ) : (
                  <Paper withBorder>
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Pincode</Table.Th>
                          <Table.Th>City</Table.Th>
                          <Table.Th>State</Table.Th>
                          <Table.Th>Status</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {paginatedPincodes.map((pincode) => (
                          <Table.Tr key={pincode.id}>
                            <Table.Td>
                              <Text weight={500}>{pincode.pincode}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text>{pincode.city || "N/A"}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text>{pincode.state || "N/A"}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                color={pincode.is_active ? "green" : "red"}
                                variant="light"
                                size="sm"
                              >
                                {pincode.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>

                    {totalPages > 1 && (
                      <Group justify="center" p="md">
                        <Pagination
                          value={currentPage}
                          onChange={setCurrentPage}
                          total={totalPages}
                          size="sm"
                        />
                      </Group>
                    )}
                  </Paper>
                )}
              </>
            )}

            {(zoneDetails?.is_nationwide || zone.is_nationwide) && (
              <Alert icon={<IconWorld />} title="Nationwide Zone" color="blue">
                <Text size="sm">
                  This zone covers all pincodes nationwide. Products assigned to
                  this zone are available for delivery across India.
                </Text>
              </Alert>
            )}

            {/* Action Buttons */}
            <Group justify="flex-end">
              <Button variant="subtle" onClick={handleClose}>
                Close
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
};

ZoneDetailsModal.propTypes = {
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  zone: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    display_name: PropTypes.string,
    description: PropTypes.string,
    is_nationwide: PropTypes.bool,
    is_active: PropTypes.bool,
    created_at: PropTypes.string,
    updated_at: PropTypes.string,
  }),
};

export default ZoneDetailsModal;
