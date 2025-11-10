import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Card,
  Title,
  Stack,
  Radio,
  MultiSelect,
  Textarea,
  Alert,
  Group,
  Badge,
  Text,
  Loader,
} from "@mantine/core";
import { IconWorld, IconMapPin, IconInfoCircle } from "@tabler/icons-react";
import { fetchZones } from "../../utils/zoneApi";

const ProductDeliverySettings = ({
  value = {
    delivery_type: "nationwide",
    allowed_zone_ids: [],
    delivery_notes: "",
  },
  onChange,
  disabled = false,
}) => {
  const [zones, setZones] = useState([]);
  const [loadingZones, setLoadingZones] = useState(true);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      const response = await fetchZones({
        active_only: true,
        limit: 100, // Get all active zones
      });

      if (response.success) {
        // Filter out nationwide zone and format for MultiSelect
        const zoneOptions = response.zones
          .filter((zone) => !zone.is_nationwide)
          .map((zone) => ({
            value: zone.id.toString(),
            label: zone.display_name,
            description: `${zone.pincode_count || 0} pincodes`,
            zone: zone,
          }));

        setZones(zoneOptions);
      }
    } catch (error) {
      console.error("Failed to load zones:", error);
    } finally {
      setLoadingZones(false);
    }
  };

  const handleDeliveryTypeChange = (newType) => {
    const updatedValue = {
      ...value,
      delivery_type: newType,
      allowed_zone_ids: newType === "nationwide" ? [] : value.allowed_zone_ids,
    };
    onChange(updatedValue);
  };

  const handleZonesChange = (selectedZoneIds) => {
    const updatedValue = {
      ...value,
      allowed_zone_ids: selectedZoneIds.map((id) => parseInt(id)),
    };
    onChange(updatedValue);
  };

  const handleNotesChange = (event) => {
    const updatedValue = {
      ...value,
      delivery_notes: event.target.value,
    };
    onChange(updatedValue);
  };

  const selectedZonesData = zones.filter((zone) =>
    value.allowed_zone_ids?.includes(parseInt(zone.value))
  );

  return (
    <Card withBorder p="md">
      <Stack spacing="md">
        <Group align="center" spacing="sm">
          <IconMapPin size={20} />
          <Title order={4}>Delivery Settings</Title>
        </Group>

        {/* Delivery Type Selection */}
        <div>
          <Text size="sm" weight={500} mb="xs">
            Delivery Type
          </Text>
          <Radio.Group
            value={value.delivery_type}
            onChange={handleDeliveryTypeChange}
            disabled={disabled}
          >
            <Stack spacing="xs">
              <Radio
                value="nationwide"
                label={
                  <Group spacing="xs">
                    <IconWorld size={16} />
                    <span>Nationwide Delivery</span>
                    <Badge size="xs" variant="light" color="blue">
                      All Pincodes
                    </Badge>
                  </Group>
                }
                description="Available for delivery across all pincodes in India"
              />
              <Radio
                value="zonal"
                label={
                  <Group spacing="xs">
                    <IconMapPin size={16} />
                    <span>Specific Zones Only</span>
                    <Badge size="xs" variant="light" color="orange">
                      Limited Areas
                    </Badge>
                  </Group>
                }
                description="Available only in selected delivery zones"
              />
            </Stack>
          </Radio.Group>
        </div>

        {/* Zone Selection for Zonal Delivery */}
        {value.delivery_type === "zonal" && (
          <div>
            <Text size="sm" weight={500} mb="xs">
              Select Delivery Zones
            </Text>
            {loadingZones ? (
              <Group spacing="sm">
                <Loader size="sm" />
                <Text size="sm" color="dimmed">
                  Loading zones...
                </Text>
              </Group>
            ) : (
              <MultiSelect
                placeholder="Choose zones where this product can be delivered"
                data={zones}
                value={value.allowed_zone_ids?.map((id) => id.toString()) || []}
                onChange={handleZonesChange}
                searchable
                clearable
                disabled={disabled}
                nothingFound={
                  zones.length === 0
                    ? "No zones available"
                    : "No matching zones"
                }
                maxDropdownHeight={300}
              />
            )}

            {/* Selected Zones Summary */}
            {selectedZonesData.length > 0 && (
              <div>
                <Text size="xs" color="dimmed" mt="xs" mb="xs">
                  Selected zones ({selectedZonesData.length}):
                </Text>
                <Group spacing="xs">
                  {selectedZonesData.map((zone) => (
                    <Badge
                      key={zone.value}
                      size="sm"
                      variant="light"
                      color="orange"
                    >
                      {zone.label}
                    </Badge>
                  ))}
                </Group>
              </div>
            )}

            {/* Validation Alert */}
            {value.delivery_type === "zonal" &&
              (!value.allowed_zone_ids ||
                value.allowed_zone_ids.length === 0) && (
                <Alert
                  icon={<IconInfoCircle />}
                  title="Zone Selection Required"
                  color="orange"
                >
                  <Text size="sm">
                    Please select at least one delivery zone for zonal delivery.
                  </Text>
                </Alert>
              )}
          </div>
        )}

        {/* Nationwide Info */}
        {value.delivery_type === "nationwide" && (
          <Alert icon={<IconWorld />} title="Nationwide Delivery" color="blue">
            <Text size="sm">
              This product will be available for delivery across all pincodes in
              India.
            </Text>
          </Alert>
        )}

        {/* Delivery Notes */}
        <div>
          <Text size="sm" weight={500} mb="xs">
            Delivery Notes (Optional)
          </Text>
          <Textarea
            placeholder="Add any special delivery instructions or restrictions..."
            value={value.delivery_notes || ""}
            onChange={handleNotesChange}
            disabled={disabled}
            rows={3}
            maxLength={500}
          />
          <Text size="xs" color="dimmed" mt="xs">
            {(value.delivery_notes || "").length}/500 characters
          </Text>
        </div>

        {/* Summary */}
        <div>
          <Text size="xs" weight={500} color="dimmed" mb="xs">
            DELIVERY SUMMARY
          </Text>
          <Group spacing="xs">
            <Badge
              color={value.delivery_type === "nationwide" ? "blue" : "orange"}
              variant="light"
            >
              {value.delivery_type === "nationwide"
                ? "Nationwide"
                : `${value.allowed_zone_ids?.length || 0} Zones`}
            </Badge>

            {value.delivery_type === "zonal" &&
              selectedZonesData.length > 0 && (
                <Badge variant="light" color="gray">
                  {selectedZonesData.reduce((total, zone) => {
                    const pincodeCount = parseInt(
                      zone.description?.match(/\d+/)?.[0] || "0"
                    );
                    return total + pincodeCount;
                  }, 0)}{" "}
                  Pincodes
                </Badge>
              )}
          </Group>
        </div>
      </Stack>
    </Card>
  );
};

ProductDeliverySettings.propTypes = {
  value: PropTypes.shape({
    delivery_type: PropTypes.string,
    allowed_zone_ids: PropTypes.arrayOf(PropTypes.number),
    delivery_notes: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

ProductDeliverySettings.defaultProps = {
  value: {
    delivery_type: "nationwide",
    allowed_zone_ids: [],
    delivery_notes: "",
  },
  disabled: false,
};

export default ProductDeliverySettings;
