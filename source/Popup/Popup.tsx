import React, { useState } from "react";
import { browser } from "webextension-polyfill-ts";
import {
  MANUAL_MESSAGE_TYPE,
  AUTO_MESSAGE_TYPE,
  timezone2LongName,
} from "../Background";
import {
  Typography,
  // Card,
  // CardContent,
  Button,
  TextField,
  // Accordion,
  // AccordionSummary,
  // AccordionDetails,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
} from "@material-ui/core";
// import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { Autocomplete, Skeleton } from "@material-ui/lab";
import styled from "styled-components";
import offsets from "../scripts/offsets";
import { storageType } from "../Background";

const offsetKeys = Object.keys(offsets);

const StyledCard = styled.div`
  // max-width: 300px;
  text-align: center;
  width: 300px;
  // height: 550px;
`;

const FullWidthDiv = styled.div`
  width: 100%;
`;

// const StyledAccordionDetails = styled(AccordionDetails)`
//   width: 90%;
// `;

const StyledButton = styled(Button)`
  margin-top: 10px;
`;

const handleChange = (timezone: string) => {
  const sending = browser.runtime.sendMessage({
    type: MANUAL_MESSAGE_TYPE,
    timezone: timezone,
    enabled: true,
  });
  sending.then(
    (success) => console.log("button sending MANUAL success:", success),
    (error) => console.log("button sending MANUAL error:", error)
  );
};

const handleRefresh = () => {
  const sending = browser.runtime.sendMessage({
    type: AUTO_MESSAGE_TYPE,
  });
  sending.then(
    (success) => console.log("button sending AUTO success:", success),
    (error) => console.log("button sending AUTO error:", error)
  );
};

const Popup: React.FC = () => {
  const [state, setState] = useState<storageType>({
    location: "loading",
    offset: 0,
  });
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState<string>("Etc/GMT");
  const store = browser.storage.local.get([
    "location",
    "standard",
    "daylight",
    "offset",
    "isDST",
    "enabled",
    "ip",
  ]);
  store.then((result) => {
    // const { location, standard, daylight, offset, isDST, enabled } = result;
    setState(result);
    setLoading(false);
  });
  return (
    <StyledCard>
      {/* <CardContent> */}
      <Typography variant="h5">VPN Timezone</Typography>
      {loading && <LinearProgress />}
      <Typography variant="subtitle2">
        Timezone: {loading ? <Skeleton /> : state.location}
      </Typography>
      <Typography variant="subtitle2">
        Time: {loading ? <Skeleton /> : timezone2LongName(state.location!)}
      </Typography>
      {/* </CardContent> */}
      {/* <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}> */}
      {/* <Typography variant="subtitle1">More Details</Typography> */}
      {/* </AccordionSummary>
        <StyledAccordionDetails> */}
      <FullWidthDiv>
        <List>
          <ListItem>
            <ListItemText
              primary="Detected IP Address"
              secondary={`${loading ? "" : state.ip}`}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Detected Timezone"
              secondary={`${loading ? "" : state.location}`}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Offset"
              secondary={`${loading ? "" : state.offset}`}
            />
          </ListItem>
        </List>
        <Autocomplete
          id="manual-entry"
          options={offsetKeys}
          getOptionLabel={(option) => option}
          autoHighlight={true}
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth={true}
              label="Manual Timezone"
              variant="filled"
            />
          )}
          onChange={(_event: any, newValue: string | null) => {
            // newValue !== null && setValue(newValue)
            newValue !== null &&
              offsetKeys.includes(newValue) &&
              handleChange(newValue);
            newValue !== null && setValue(newValue);
          }}
        />
        {value}
        <StyledButton
          variant="contained"
          color="primary"
          fullWidth={true}
          onClick={handleRefresh}
        >
          Change timezone based on ip
        </StyledButton>
      </FullWidthDiv>
      {/* </StyledAccordionDetails>
      </Accordion> */}
    </StyledCard>
  );
};

export default Popup;
