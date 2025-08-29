export interface Section {
	type: string;
	hits: Hit[];
}

export interface Hit {
	highlights: Highlight[];
	index: string;
	type: string;
	result: Result;
}

export interface Highlight {
	property: string;
	value: string;
	snippet: boolean;
	ranges: Range[];
}

export interface Range {
	start: number;
	end: number;
}

export interface Result {
	_type: string;
	annotation_count: number;
	api_path: string;
	artist_names: string;
	full_title: string;
	header_image_thumbnail_url: string;
	header_image_url: string;
	id: number;
	instrumental: boolean;
	lyrics_owner_id: number;
	lyrics_state: string;
	lyrics_updated_at: number;
	path: string;
	primary_artist_names: string;
	pyongs_count: any;
	relationships_index_url: string;
	release_date_components: ReleaseDateComponents;
	release_date_for_display: string;
	release_date_with_abbreviated_month_for_display: string;
	song_art_image_thumbnail_url: string;
	song_art_image_url: string;
	stats: Stats;
	title: string;
	title_with_featured: string;
	updated_by_human_at: number;
	url: string;
	featured_artists: FeaturedArtist[];
	primary_artist: PrimaryArtist;
	primary_artists: PrimaryArtist[];
}

export interface ReleaseDateComponents {
	year: number;
	month: number;
	day: number;
}

export interface Stats {
	unreviewed_annotations: number;
	hot: boolean;
}

export interface FeaturedArtist {
	_type: string;
	api_path: string;
	header_image_url: string;
	id: number;
	image_url: string;
	index_character: string;
	is_meme_verified: boolean;
	is_verified: boolean;
	name: string;
	slug: string;
	url: string;
	iq?: number;
}

export interface PrimaryArtist {
	_type: string;
	api_path: string;
	header_image_url: string;
	id: number;
	image_url: string;
	index_character: string;
	is_meme_verified: boolean;
	is_verified: boolean;
	name: string;
	slug: string;
	url: string;
	iq?: number;
}

export interface Song {
	_type: string;
	annotation_count: number;
	api_path: string;
	apple_music_id: null;
	apple_music_player_url: string;
	artist_names: string;
	comment_count: number;
	custom_header_image_url: null;
	custom_song_art_image_url: string;
	description: Description;
	description_preview: string;
	embed_content: string;
	explicit: boolean;
	facebook_share_message_without_url: string;
	featured_video: boolean;
	full_title: string;
	has_instagram_reel_annotations: boolean;
	header_image_thumbnail_url: string;
	header_image_url: string;
	hidden: boolean;
	id: number;
	instrumental: boolean;
	is_music: boolean;
	language: string;
	lyrics: Lyrics;
	lyrics_owner_id: number;
	lyrics_placeholder_reason: null;
	lyrics_state: string;
	lyrics_updated_at: number;
	lyrics_verified: boolean;
	metadata_fields_na: MetadataFieldsNa;
	next_song_source: string;
	path: string;
	pending_lyrics_edits_count: number;
	primary_artist_names: string;
	published: boolean;
	pusher_channel: string;
	pyongs_count: null;
	recording_location: null;
	relationships_index_url: string;
	release_date: Date;
	release_date_components: ReleaseDateComponents;
	release_date_for_display: string;
	release_date_with_abbreviated_month_for_display: string;
	share_url: string;
	song_art_image_thumbnail_url: string;
	song_art_image_url: string;
	soundcloud_url: string;
	spotify_uuid: null;
	stats: SongStats;
	title: string;
	title_with_featured: string;
	tracking_data: TrackingDatum[];
	tracking_paths: TrackingPaths;
	transcription_priority: string;
	twitter_share_message: string;
	twitter_share_message_without_url: string;
	updated_by_human_at: number;
	url: string;
	viewable_by_roles: any[];
	vttp_id: null;
	youtube_start: null;
	youtube_url: null;
	current_user_metadata: SongCurrentUserMetadata;
	song_art_primary_color: string;
	song_art_secondary_color: string;
	song_art_text_color: string;
	album: Album;
	albums: Album[];
	custom_performances: any[];
	description_annotation: DescriptionAnnotation;
	featured_artists: any[];
	lyrics_marked_complete_by: null;
	lyrics_marked_staff_approved_by: null;
	media: Media[];
	next_song: Song;
	primary_artist: Artist;
	primary_artists: Artist[];
	primary_tag: PrimaryTagClass;
	producer_artists: any[];
	song_relationships: SongRelationship[];
	tags: PrimaryTagClass[];
	top_scholar: TopScholar;
	translation_songs: any[];
	verified_annotations_by: any[];
	verified_contributors: any[];
	verified_lyrics_by: any[];
	writer_artists: any[];
}

export interface Album {
	_type: string;
	api_path: string;
	cover_art_thumbnail_url: string;
	cover_art_url: string;
	full_title: string;
	id: number;
	name: string;
	name_with_artist: string;
	primary_artist_names: string;
	release_date_components: ReleaseDateComponents;
	release_date_for_display: string;
	url: string;
	artist: Artist;
	primary_artists: Artist[];
}

export interface Artist {
	_type: PrimaryArtistType;
	api_path: string;
	header_image_url: string;
	id: number;
	image_url: string;
	index_character: string;
	is_meme_verified: boolean;
	is_verified: boolean;
	name: string;
	slug: string;
	url: string;
}

export enum PrimaryArtistType {
	Artist = "artist",
}

export interface ReleaseDateComponents {
	year: number;
	month: number;
	day: number;
}

export interface SongCurrentUserMetadata {
	permissions: string[];
	excluded_permissions: string[];
	interactions: PurpleInteractions;
	relationships: IqByAction;
	iq_by_action: IqByAction;
}

export interface PurpleInteractions {
	pyong: boolean;
	following: boolean;
}

export interface IqByAction {}

export interface Description {
	dom: DescriptionDOM;
}

export interface DescriptionDOM {
	tag: string;
	children: DOMChildClass[];
}

export interface DOMChildClass {
	tag: string;
	children: string[];
}

export interface DescriptionAnnotation {
	_type: string;
	annotator_id: number;
	annotator_login: string;
	api_path: string;
	classification: string;
	fragment: string;
	id: number;
	ios_app_url: string;
	is_description: boolean;
	is_image: boolean;
	path: string;
	range: Range;
	song_id: number;
	url: string;
	verified_annotator_ids: any[];
	current_user_metadata: DescriptionAnnotationCurrentUserMetadata;
	tracking_paths: TrackingPaths;
	twitter_share_message: string;
	annotatable: Annotatable;
	annotations: Annotation[];
}

export interface Annotatable {
	_type: string;
	api_path: string;
	client_timestamps: ClientTimestamps;
	context: string;
	id: number;
	image_url: string;
	link_title: string;
	title: string;
	type: string;
	url: string;
}

export interface ClientTimestamps {
	updated_by_human_at: number;
	lyrics_updated_at: number;
}

export interface Annotation {
	_type: string;
	api_path: string;
	being_created: boolean;
	body: Body;
	comment_count: number;
	community: boolean;
	created_at: number;
	custom_preview: null;
	deleted: boolean;
	embed_content: string;
	has_voters: boolean;
	id: number;
	needs_exegesis: boolean;
	pinned: boolean;
	proposed_edit_count: number;
	pyongs_count: null;
	referent_id: number;
	share_url: string;
	source: null;
	state: string;
	twitter_share_message: string;
	url: string;
	verified: boolean;
	votes_total: number;
	current_user_metadata: AnnotationCurrentUserMetadata;
	accepted_by: null;
	authors: TopScholar[];
	cosigned_by: any[];
	created_by: User;
	rejection_comment: null;
	top_comment: null;
	verified_by: null;
}

export interface TopScholar {
	_type: string;
	attribution?: number;
	pinned_role: null;
	user: User;
	attribution_value?: number;
}

export interface User {
	_type: string;
	about_me_summary: string;
	api_path: string;
	avatar: Avatar;
	header_image_url: string;
	human_readable_role_for_display: string;
	id: number;
	iq: number;
	is_meme_verified: boolean;
	is_verified: boolean;
	login: string;
	name: string;
	role_for_display: string;
	url: string;
	current_user_metadata: UserCurrentUserMetadata;
}

export interface Avatar {
	tiny: Medium;
	thumb: Medium;
	small: Medium;
	medium: Medium;
}

export interface Medium {
	url: string;
	bounding_box: BoundingBox;
}

export interface BoundingBox {
	width: number;
	height: number;
}

export interface UserCurrentUserMetadata {
	permissions: any[];
	excluded_permissions: string[];
	interactions: FluffyInteractions;
}

export interface FluffyInteractions {
	following: boolean;
}

export interface Body {
	dom: BodyDOM;
}

export interface BodyDOM {
	tag: string;
}

export interface AnnotationCurrentUserMetadata {
	permissions: any[];
	excluded_permissions: string[];
	interactions: TentacledInteractions;
	iq_by_action: IqByAction;
}

export interface TentacledInteractions {
	cosign: boolean;
	pyong: boolean;
	vote: null;
}

export interface DescriptionAnnotationCurrentUserMetadata {
	permissions: any[];
	excluded_permissions: string[];
	relationships: IqByAction;
}

export interface Range {
	content: string;
}

export interface TrackingPaths {
	aggregate: string;
	concurrent: string;
}

export interface Lyrics {
	dom: LyricsDOM;
}

export interface LyricsDOM {
	tag: string;
	children: Array<PurpleChild | string>;
}

export interface PurpleChild {
	tag: string;
	children: Array<FluffyChild | string>;
}

export interface FluffyChild {
	tag: FluffyTag;
	attributes?: PurpleAttributes;
	data?: Data;
	children?: Array<TentacledChild | string>;
}

export interface PurpleAttributes {
	href?: string;
	class?: string;
	id?: string;
	sizes?: string;
}

export interface TentacledChild {
	tag: PurpleTag;
	attributes?: FluffyAttributes;
}

export interface FluffyAttributes {
	key: string;
	value: string;
}

export enum PurpleTag {
	Br = "br",
	DfpKv = "dfp-kv",
}

export interface Data {
	id: string;
	"editorial-state": string;
	classification: string;
}

export enum FluffyTag {
	A = "a",
	Br = "br",
	DfpUnit = "dfp-unit",
}

export interface Media {
	attribution: string;
	provider: string;
	type: string;
	url: string;
}

export interface MetadataFieldsNa {
	albums: boolean;
	song_meaning: boolean;
}

export interface PrimaryTagClass {
	_type: string;
	id: number;
	name: string;
	primary: boolean;
	url: string;
}

export interface SongRelationship {
	_type: SongRelationshipType;
	relationship_type: string;
	type: string;
	songs: any[];
}

export enum SongRelationshipType {
	SongRelationship = "song_relationship",
}

export interface SongStats {
	accepted_annotations: number;
	contributors: number;
	iq_earners: number;
	transcribers: number;
	unreviewed_annotations: number;
	verified_annotations: number;
	hot: boolean;
}

export interface TrackingDatum {
	key: string;
	value: Array<number | string> | boolean | number | null | string;
}
