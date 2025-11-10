import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Modal,
  Text,
  Group,
  Button,
  TextInput,
  Textarea,
  Switch,
  Stack,
  Alert,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX, IconInfoCircle } from "@tabler/icons-react";
import { createZone, updateZone } from "../../utils/zoneApi";

const ZoneForm = ({ opened, onClose, zone, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(zone);

  const form = useForm({
    initialValues: {
      name: "",
      display_name: "",
      description: "",
      is_nationwide: false,
      is_active: true,
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return "Zone name is required";
        if (value.length > 100)
          return "Zone name must be less than 100 characters";
        if (!/^[a-zA-Z0-9\s\-_]+$/.test(value))
          return "Zone name contains invalid characters";
        if (
          ["nationwide", "all", "global", "admin", "system"].includes(
            value.toLowerCase()
          )
        ) {
          return "This zone name is reserved";
        }
        return null;
      },
      display_name: (value) => {
        if (!value.trim()) return "Display name is required";
        if (value.length > 150)
          return "Display name must be less than 150 characters";
        return null;
      },
      description: (value) => {
        if (value && value.length > 500)
          return "Description must be less than 500 characters";
        return null;
      },
    },
  });

  // Update form when zone prop changes
  useEffect(() => {
    if (zone) {
      const newValues = {
        name: zone.name || "",
        display_name: zone.display_name || "",
        description: zone.description || "",
        is_nationwide: zone.is_nationwide || false,
        is_active: zone.is_active !== undefined ? zone.is_active : true,
      };

      // Only update if values are different to prevent infinite loop
      const currentValues = form.getValues();
      if (JSON.stringify(newValues) !== JSON.stringify(currentValues)) {
        form.setValues(newValues);
      }
    } else {
      form.reset();
    }
  }, [zone]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      let result;

      if (isEdit) {
        result = await updateZone(zone.id, values);
      } else {
        result = await createZone(values);
      }

      if (result.success) {
        notifications.show({
          title: "Success",
          message: `Zone ${isEdit ? "updated" : "created"} successfully`,
          color: "green",
          icon: <IconCheck />,
        });

        form.reset();
        onSuccess();
        onClose();
      } else {
        throw new Error(
          result.error || `Failed to ${isEdit ? "update" : "create"} zone`
        );
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error.message || `Failed to ${isEdit ? "update" : "create"} zone`,
        color: "red",
        icon: <IconX />,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isEdit ? "Edit Zone" : "Create New Zone"}
      size="md"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack spacing="md">
          {/* Zone Name */}
          <TextInput
            label="Zone Name"
            placeholder="e.g., delhi_ncr, mumbai_metro"
            required
            autoFocus
            {...form.getInputProps("name")}
          />

          {/* Display Name */}
          <TextInput
            label="Display Name"
            placeholder="e.g., Delhi NCR, Mumbai Metropolitan"
            required
            {...form.getInputProps("display_name")}
          />

          {/* Description */}
          <Textarea
            label="Description"
            placeholder="Describe the coverage area of this zone..."
            rows={3}
            {...form.getInputProps("description")}
          />

          {/* Nationwide Toggle */}
          <div>
            <Switch
              label="Nationwide Zone"
              description="Enable if this zone covers all pincodes nationwide"
              disabled={isEdit && zone?.name === "nationwide"}
              {...form.getInputProps("is_nationwide", { type: "checkbox" })}
            />
          </div>

          {/* Nationwide Warning */}
          {form.values.is_nationwide && (
            <Alert
              icon={<IconInfoCircle />}
              title="Nationwide Zone"
              color="blue"
            >
              <Text size="sm">
                Nationwide zones don&apos;t require pincode entries. Products
                assigned to this zone will be available for delivery across all
                pincodes.
              </Text>
            </Alert>
          )}

          {/* Active Toggle */}
          <div>
            <Switch
              label="Active Zone"
              description="Inactive zones won't be available for product assignment"
              disabled={isEdit && zone?.name === "nationwide"}
              {...form.getInputProps("is_active", { type: "checkbox" })}
            />
          </div>

          {/* Action Buttons */}
          <Group justify="flex-end" spacing="sm">
            <Button variant="subtle" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? "Update Zone" : "Create Zone"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

ZoneForm.propTypes = {
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  zone: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    display_name: PropTypes.string,
    description: PropTypes.string,
    is_nationwide: PropTypes.bool,
    is_active: PropTypes.bool,
  }),
  onSuccess: PropTypes.func.isRequired,
};

export default ZoneForm;
