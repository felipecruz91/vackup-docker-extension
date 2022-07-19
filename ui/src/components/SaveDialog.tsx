import React, {useContext} from "react";
import {Backdrop, Button, CircularProgress, Grid, TextField, Typography,} from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import {createDockerDesktopClient} from "@docker/extension-api-client";

import {MyContext} from "../index";

const client = createDockerDesktopClient();

function useDockerDesktopClient() {
    return client;
}

export default function SaveDialog({...props}) {
    console.log("SaveDialog component rendered.");
    const ddClient = useDockerDesktopClient();

    const context = useContext(MyContext);
    const defaultImageName = `vackup-${context.store.volumeName}:latest`;
    const [imageName, setImageName] = React.useState<string>(defaultImageName);
    const [actionInProgress, setActionInProgress] =
        React.useState<boolean>(false);

    const saveVolume = async () => {
        setActionInProgress(true);

        ddClient.extension.vm.service
            .get(`/volumes/${context.store.volumeName}/save?image=${imageName}`)
            .then((_: any) => {
                ddClient.desktopUI.toast.success(
                    `Volume ${context.store.volumeName} copied into image ${imageName}, under /volume-data`
                );
            })
            .catch((error) => {
                ddClient.desktopUI.toast.error(
                    `Failed to copy volume ${context.store.volumeName} into image ${imageName}: ${error.message}. HTTP status code: ${error.statusCode}`
                );
            })
            .finally(() => {
                setActionInProgress(false);
                props.onClose();
            })
    };

    return (
        <Dialog open={props.open} onClose={props.onClose}>
            <DialogTitle>Copy the volume contents to a local image</DialogTitle>
            <DialogContent>
                <Backdrop
                    sx={{
                        backgroundColor: "rgba(245,244,244,0.4)",
                        zIndex: (theme) => theme.zIndex.drawer + 1,
                    }}
                    open={actionInProgress}
                >
                    <CircularProgress color="info"/>
                </Backdrop>
                <DialogContentText>
                    Copies the volume contents to a busybox image in the /volume-data
                    directory.
                </DialogContentText>

                <Grid container direction="column" spacing={2}>
                    <Grid item>
                        <TextField
                            required
                            autoFocus
                            margin="dense"
                            id="image-name"
                            label="Image name"
                            fullWidth
                            variant="standard"
                            placeholder={defaultImageName}
                            defaultValue={defaultImageName}
                            spellCheck={false}
                            onChange={(e) => {
                                setImageName(e.target.value);
                            }}
                        />
                    </Grid>

                    {imageName !== "" && (
                        <Grid item>
                            <Typography variant="body1" color="text.secondary" sx={{mb: 2}}>
                                The volume contents will be saved into the /volume-content
                                directory of the image {imageName}.
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{mb: 2}}>
                                Once the operation is completed, you could see the data from a
                                terminal:
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{mb: 2}}>
                                $ docker run --rm {imageName} ls /volume-data
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                ⚠️ This will replace any existing data inside the
                                /volume-content directory of the image.
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        props.onClose();
                    }}
                >
                    Cancel
                </Button>
                <Button onClick={saveVolume} disabled={imageName === ""}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}
