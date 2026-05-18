import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { ethers } from "ethers";

import "./profile.css";
import "../../global.css";
import { GlobalToolBar } from "../../global";
import { DAPP_NAME, shortAddress } from "../../config/dapp";
import { Icon } from "../ui/Icon";
import {
    createListing,
    createListingUploadUrl,
    fetchCreatorEarnings,
    fetchCreatorListings,
    submitListingForReview,
    uploadFileToSignedUrl
} from "../../config/api";

const decimalEthToWei = (value) => {
    try {
        const clean = String(value || "0").trim();
        if (!clean || Number(clean) <= 0) {
            return "0";
        }
        return ethers.parseEther(clean).toString();
    } catch (err) {
        return "0";
    }
};

const formatWei = (value) => {
    if (!value) {
        return "0";
    }
    try {
        const formatted = ethers.formatEther(String(value));
        return Number(formatted).toLocaleString(undefined, {
            maximumFractionDigits: 4
        });
    } catch (err) {
        return "0";
    }
};

const initialListing = {
    title: "",
    school: "",
    course: "",
    tags: "",
    description: "",
    priceEth: "0.001"
};

export default function Profile(props){
    const {
        address,
        networkType,
        balance,
        isConnected,
        isSupportedNetwork,
        apiToken,
        apiUser,
        apiAuthError,
        toolbarProps = {}
    } = props;

    const [listingInput, setListingInput] = useState(initialListing);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [creatorListings, setCreatorListings] = useState([]);
    const [earnings, setEarnings] = useState({ gross_sales_wei: "0", sales_count: 0 });
    const [loadingCreatorData, setLoadingCreatorData] = useState(false);
    const [uploadState, setUploadState] = useState({ status: "idle", message: "" });

    const loadCreatorData = useCallback(async () => {
        if (!apiToken) {
            setCreatorListings([]);
            setEarnings({ gross_sales_wei: "0", sales_count: 0 });
            return;
        }

        setLoadingCreatorData(true);
        try {
            const [listingsPayload, earningsPayload] = await Promise.all([
                fetchCreatorListings(apiToken),
                fetchCreatorEarnings(apiToken)
            ]);
            setCreatorListings(listingsPayload.listings || []);
            setEarnings(earningsPayload.earnings || { gross_sales_wei: "0", sales_count: 0 });
        } catch (err) {
            setUploadState({ status: "error", message: err?.message || "Unable to load creator data." });
        } finally {
            setLoadingCreatorData(false);
        }
    }, [apiToken]);

    useEffect(() => {
        loadCreatorData();
    }, [loadCreatorData]);

    const creatorStats = useMemo(() => {
        const pending = creatorListings.filter((item) => item.status === "pending_review").length;
        const approved = creatorListings.filter((item) => item.status === "approved").length;
        const drafts = creatorListings.filter((item) => item.status === "draft").length;

        return {
            total: creatorListings.length,
            pending,
            approved,
            drafts,
            grossEth: formatWei(earnings?.gross_sales_wei || "0"),
            salesCount: earnings?.sales_count || 0
        };
    }, [creatorListings, earnings]);

    const handleInput = (event) => {
        const { name, value } = event.target;
        setListingInput((current) => ({ ...current, [name]: value }));
    };

    const acceptFile = (file) => {
        if (!file) {
            return;
        }
        setSelectedFile(file);
        setUploadState({ status: "idle", message: "" });
    };

    const handleFileInput = (event) => {
        acceptFile(event.target.files?.[0]);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        acceptFile(event.dataTransfer.files?.[0]);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!apiToken) {
            setUploadState({ status: "error", message: "Sign the wallet session before uploading." });
            return;
        }
        if (!selectedFile) {
            setUploadState({ status: "error", message: "Drop a PDF, image, or file first." });
            return;
        }
        if (!listingInput.title.trim()) {
            setUploadState({ status: "error", message: "Give the cheat sheet a title." });
            return;
        }

        setUploadState({ status: "working", message: "Creating listing..." });
        try {
            const tags = listingInput.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
                .slice(0, 12);

            const { listing } = await createListing(apiToken, {
                title: listingInput.title.trim(),
                school: listingInput.school.trim(),
                course: listingInput.course.trim(),
                tags,
                description: listingInput.description.trim(),
                priceWei: decimalEthToWei(listingInput.priceEth)
            });

            setUploadState({ status: "working", message: "Preparing private upload..." });
            const { uploadUrl } = await createListingUploadUrl(apiToken, listing.id, selectedFile.type || "application/octet-stream");

            setUploadState({ status: "working", message: "Uploading to private storage..." });
            await uploadFileToSignedUrl({
                uploadUrl,
                file: selectedFile,
                contentType: selectedFile.type || "application/octet-stream"
            });

            setUploadState({ status: "working", message: "Submitting for review..." });
            await submitListingForReview(apiToken, listing.id);

            setListingInput(initialListing);
            setSelectedFile(null);
            setUploadState({ status: "success", message: "Uploaded. The listing is queued for review." });
            await loadCreatorData();
        } catch (err) {
            setUploadState({ status: "error", message: err?.message || "Upload failed." });
        }
    };

    const ProfilePage = () => (
        <div className="page profile-page creator-shell">
            <GlobalToolBar
                {...toolbarProps}
                isConnected={toolbarProps.isConnected}
            />

            <main className="creator-workbench">
                <section className="creator-hero">
                    <div>
                        <p className="eyebrow">Creator workbench</p>
                        <h1>{DAPP_NAME}</h1>
                        <p>
                            Drag in a cheat sheet, price it, store it privately, and track every paid unlock from one production surface.
                        </p>
                    </div>
                    <div className="creator-hero__status">
                        <span className={`status-chip ${apiToken ? "status-chip--success" : "status-chip--pending"}`}>
                            {apiToken ? "API session signed" : "Wallet signature needed"}
                        </span>
                        <span className="status-chip status-chip--neutral">{networkType || "Unknown network"}</span>
                    </div>
                </section>

                {!isSupportedNetwork && (
                    <div className="system-banner">
                        <strong>Network mismatch</strong>
                        <span>Uploads use the backend, but contract actions stay paused until the wallet is on the configured network.</span>
                    </div>
                )}

                {apiAuthError && (
                    <div className="system-banner system-banner--warning">
                        <strong>Backend sign-in failed</strong>
                        <span>{apiAuthError}</span>
                    </div>
                )}

                <section className="creator-grid">
                    <form className="upload-workbench" onSubmit={handleSubmit}>
                        <div className="panel-heading">
                            <div>
                                <h2>New upload</h2>
                                <p>Files go to private object storage. Public access is issued later through signed URLs.</p>
                            </div>
                            <button className="btn btn--primary" type="submit" disabled={!apiToken || uploadState.status === "working"}>
                                <Icon name="upload" size={18} />
                                {uploadState.status === "working" ? "Uploading" : "Publish draft"}
                            </button>
                        </div>

                        <label
                            className={`drop-zone${isDragging ? " is-dragging" : ""}`}
                            onDragOver={(event) => {
                                event.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                        >
                            <input type="file" onChange={handleFileInput} />
                            <Icon name="file" size={28} />
                            <span>{selectedFile ? selectedFile.name : "Drop a PDF, image, or worksheet"}</span>
                            <small>{selectedFile ? `${Math.max(1, Math.round(selectedFile.size / 1024))} KB ready` : "or click to choose a file"}</small>
                        </label>

                        <div className="upload-fields">
                            <label>
                                <span>Title</span>
                                <input name="title" value={listingInput.title} onChange={handleInput} placeholder="CS2100 finals cheat sheet" />
                            </label>
                            <label>
                                <span>Price in ETH</span>
                                <input name="priceEth" value={listingInput.priceEth} onChange={handleInput} inputMode="decimal" />
                            </label>
                            <label>
                                <span>School</span>
                                <input name="school" value={listingInput.school} onChange={handleInput} placeholder="NUS" />
                            </label>
                            <label>
                                <span>Course</span>
                                <input name="course" value={listingInput.course} onChange={handleInput} placeholder="CS2100" />
                            </label>
                            <label className="field-wide">
                                <span>Tags</span>
                                <input name="tags" value={listingInput.tags} onChange={handleInput} placeholder="algorithms, midterm, concise" />
                            </label>
                            <label className="field-wide">
                                <span>Description</span>
                                <textarea name="description" value={listingInput.description} onChange={handleInput} rows={4} placeholder="What is inside, who it helps, and why it is worth unlocking." />
                            </label>
                        </div>

                        {uploadState.message && (
                            <div className={`upload-state upload-state--${uploadState.status}`}>
                                {uploadState.message}
                            </div>
                        )}
                    </form>

                    <aside className="creator-side">
                        <div className="identity-panel">
                            <span>Signed creator</span>
                            <strong>{apiUser?.display_name || shortAddress(address)}</strong>
                            <p>{address}</p>
                            <small>{balance || "0"} ETH available in wallet</small>
                        </div>
                        <div className="revenue-panel">
                            <div>
                                <span>Gross sales</span>
                                <strong>{creatorStats.grossEth} ETH</strong>
                            </div>
                            <div>
                                <span>Confirmed unlocks</span>
                                <strong>{creatorStats.salesCount}</strong>
                            </div>
                            <div>
                                <span>Wallet payouts</span>
                                <strong>Contract pending</strong>
                            </div>
                        </div>
                        <div className="infra-panel">
                            <h3>Production rails</h3>
                            <ul>
                                <li><Icon name="check" size={16} /> API online</li>
                                <li><Icon name="check" size={16} /> Postgres migrated</li>
                                <li><Icon name="check" size={16} /> Private storage signed</li>
                                <li><Icon name="lock" size={16} /> Public downloads gated</li>
                            </ul>
                        </div>
                    </aside>
                </section>

                <section className="creator-library">
                    <div className="panel-heading">
                        <div>
                            <h2>Your listings</h2>
                            <p>{loadingCreatorData ? "Refreshing creator records..." : `${creatorStats.total} listing${creatorStats.total === 1 ? "" : "s"} in the database`}</p>
                        </div>
                        <button type="button" className="btn btn--ghost" onClick={loadCreatorData} disabled={!apiToken || loadingCreatorData}>
                            <Icon name="refresh" size={16} />
                            Refresh
                        </button>
                    </div>

                    <div className="library-summary">
                        <div><span>Draft</span><strong>{creatorStats.drafts}</strong></div>
                        <div><span>Pending review</span><strong>{creatorStats.pending}</strong></div>
                        <div><span>Approved</span><strong>{creatorStats.approved}</strong></div>
                    </div>

                    <div className="listing-table">
                        <div className="listing-row listing-row--head">
                            <span>Title</span>
                            <span>Course</span>
                            <span>Status</span>
                            <span>Price</span>
                        </div>
                        {creatorListings.length === 0 ? (
                            <div className="listing-empty">No uploads yet. Drop a file above to create the first private listing.</div>
                        ) : creatorListings.map((listing) => (
                            <div className="listing-row" key={listing.id}>
                                <span>
                                    <strong>{listing.title}</strong>
                                    <small>{listing.school || "No school set"}</small>
                                </span>
                                <span>{listing.course || "General"}</span>
                                <span className={`status-dot status-dot--${listing.status}`}>{listing.status.replace("_", " ")}</span>
                                <span>{formatWei(listing.price_wei)} ETH</span>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );

    return isConnected ? <ProfilePage /> : <Navigate to='/' />;
}
