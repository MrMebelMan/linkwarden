import { useEffect, useState } from "react";
import Select, { MultiValue } from "react-select";
import { styles } from "./styles";
import { Option } from "@linkwarden/types/inputSelect";
import { useTags } from "@linkwarden/router/tags";
import { useTranslation } from "next-i18next";

type Props = {
  onChange: (tagIds: number[]) => void;
  value?: number[];
};

export default function TagFilterSelect({ onChange, value = [] }: Props) {
  const { data: tags = [] } = useTags();
  const { t } = useTranslation();

  const [tagOptions, setTagOptions] = useState<Option[]>([]);

  useEffect(() => {
    const formatted = tags.map((e: any) => ({
      value: e.id,
      label: e.name,
    }));
    setTagOptions(formatted);
  }, [tags]);

  const selectedOptions = tagOptions.filter(
    (opt) => opt.value !== undefined && value.includes(opt.value as number)
  );

  const handleChange = (selected: MultiValue<Option>) => {
    const ids = selected
      .map((opt) => opt.value)
      .filter((v): v is number => typeof v === "number");
    onChange(ids);
  };

  return (
    <Select<Option, true>
      isMulti
      isClearable
      className="react-select-container text-sm"
      classNamePrefix="react-select"
      onChange={handleChange}
      options={tagOptions}
      styles={styles as any}
      value={selectedOptions}
      placeholder={t("filter_by_tags")}
      noOptionsMessage={() => t("no_tags_found")}
    />
  );
}
