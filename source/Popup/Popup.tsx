import React, { useState, useEffect } from "react";
import { browser, Runtime } from "webextension-polyfill-ts";
import {
  AUTO_MESSAGE_TYPE,
  SUCCESS_MESSAGE_TYPE,
  timezone2LongName,
  timezoneMessage,
} from "../Background";
import {
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import styled from "styled-components";
// import { storageType } from "../Background";

const StyledCard = styled.div`
  // max-width: 300px;
  text-align: center;
  width: 300px;
  // height: 550px;
`;

const FullWidthDiv = styled.div`
  width: 100%;
`;

const StyledButton = styled(Button)`
  margin-top: 10px;
`;

const Popup: React.FC = () => {
  // const [state, setState] = useState<storageType>({
  //   location: "loading",
  //   offset: 0,
  // });
  const [location, setLocation] = useState("");
  const [ip, setIp] = useState("");
  const [offset, setOffset] = useState("");
  const [loading, setLoading] = useState(true);

  const updateData = () => {
    setLoading(true);
    const store = browser.storage.local.get(["location", "offset", "ip"]);
    store.then((result) => {
      const { location, offset, ip } = result;
      // setState(result);
      setLocation(location);
      setOffset(offset);
      setIp(ip);
      setLoading(false);
    });
  };

  useEffect(() => {
    updateData();
  }, []);

  const getUpdateMessage = (
    data: timezoneMessage,
    sender: Runtime.MessageSender
  ) => {
    console.log("runtime.onMessage FRONTEND was called with", {
      data,
      sender,
    });
    if (data.type === SUCCESS_MESSAGE_TYPE) {
      updateData();
    }
  };

  useEffect(() => {
    browser.runtime.onMessage.addListener(getUpdateMessage);
    return () => {
      browser.runtime.onMessage.removeListener(getUpdateMessage);
    };
  }, []);

  const handleRefresh = () => {
    const sending = browser.runtime.sendMessage({
      type: AUTO_MESSAGE_TYPE,
    });
    sending.then(
      (success) => console.log("button sending AUTO success:", success),
      (error) => console.log("button sending AUTO error:", error)
    );
  };
  return (
    <StyledCard>
      <Typography variant="h5">VPN Timezone</Typography>
      {loading && <LinearProgress />}
      <Typography variant="subtitle2">
        Timezone: {loading ? <Skeleton /> : location}
      </Typography>
      <Typography variant="subtitle2">
        Time: {loading ? <Skeleton /> : timezone2LongName(location)}
      </Typography>
      <FullWidthDiv>
        <List>
          <ListItem>
            <ListItemText
              primary="Detected IP Address"
              secondary={`${loading ? "" : ip}`}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Detected Timezone"
              secondary={`${loading ? "" : location}`}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Offset"
              secondary={`${loading ? "" : offset}`}
            />
          </ListItem>
        </List>
        <StyledButton
          variant="contained"
          color="primary"
          fullWidth={true}
          onClick={handleRefresh}
        >
          Change timezone based on ip
        </StyledButton>
      </FullWidthDiv>
    </StyledCard>
  );
};

export default Popup;
