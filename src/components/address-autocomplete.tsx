import React from "react";
import { AddressAutofill } from "@mapbox/search-js-react";

export function AddressAutocomplete({
  children,
  onRetrieve,
}: {
  children: React.ReactNode;
  onRetrieve?: (res: any) => void;
}) {
  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "YOUR_MAPBOX_TOKEN_HERE";

  return (
    <AddressAutofill
      accessToken={token}
      onRetrieve={onRetrieve}
      options={{ language: "en" }}
    >
      {children}
    </AddressAutofill>
  );
}
